# app/main.py
from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from math import radians, sin, cos, asin, sqrt
from pathlib import Path
import json
import logging
from linebot.v3.messaging.models import ReplyMessageRequest, PushMessageRequest, TextMessage
from linebot.v3.messaging.exceptions import ApiException
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from linebot.v3.messaging import (
    MessagingApi, Configuration, ApiClient,
    ReplyMessageRequest, TextMessage, FlexMessage
)
from linebot.v3.webhook import WebhookParser

from app.config.settings import settings
from app.handlers.replies import (
    create_city_selection_message,
    create_district_selection_message,
    make_category_imagemap,
    bubble_from_place,
    DISTRICTS_MAP,
)
from app.handlers.replies import create_today_pick_message, create_food_roulette_message
from app.services.places import filter_places
from app.utils.category import CATEGORY_LABELS
from app.utils.links import normalize_existing_gmaps
from app.services.image_compose import build_if_needed, ensure_resized
import hmac, hashlib
from base64 import b64encode
from io import BytesIO
from fastapi import Response
from PIL import Image
from google.cloud import storage
import re

log = logging.getLogger(__name__)

# 你六張分類小圖（檔名不變）
CATS_SRC = [
    "categories_1040_0.png",
    "categories_1040_1.png",
    "categories_1040_2.png",
    "categories_1040_3.png",
    "categories_1040_4.png",
    "categories_1040_5.png",
]

TMP_DIR = "/tmp/imagemeps"   # ← 新增：統一用 /tmp

def _sync_from_gcs(bucket_name: str, prefix: str, files: list[str], local_dir: str):
    """把 GCS 上 prefix/files 同步到 local_dir"""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    Path(local_dir).mkdir(parents=True, exist_ok=True)
    for fn in files:
        blob = bucket.blob(f"{prefix}/{fn}".strip("/"))
        dst = Path(local_dir) / fn
        blob.download_to_filename(str(dst))

# ---------- App lifecycle ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # 1) 從 GCS 同步六張 1040 小圖到 /tmp/imagemeps
        if not settings.assets_bucket:
            log.error("ASSETS_BUCKET 未設定，將跳過同步（服務仍會啟動）")
        else:
            _sync_from_gcs(settings.assets_bucket, settings.assets_prefix, CATS_SRC, TMP_DIR)

        # 2) 刪除舊 1040 grid，強迫重建
        p1040 = Path(TMP_DIR) / "categories_1040_grid.png"
        if p1040.exists():
            p1040.unlink()

        # 3) 組新版 1040 grid（輸出在 /tmp/imagemeps）
        build_if_needed(
            output_path=str(p1040),
            base_path=TMP_DIR,
            categories=CATS_SRC,
        )

        # 4) 砍掉舊縮圖，讓 700/460 重新產生
        for s in (700, 460):
            p = Path(TMP_DIR) / f"categories_{s}.png"
            if p.exists():
                p.unlink()

        log.info("[lifespan] synced/rebuilt assets under %s", TMP_DIR)
    except Exception as e:
        log.exception("[lifespan] prepare assets failed: %s", e)

    yield
    return


app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# ---------- Static helpers ----------
@app.get("/imgmap/categories/{size}")
def imagemap_categories(size: int):
    """
    LINE Imagemap 會請求這個 endpoint (不帶副檔名)
    必須返回 PNG 格式
    """
    try:
        img_path = ensure_resized(size)
        
        # 確保返回 PNG 格式
        im = Image.open(img_path)
        if im.mode != "RGB":
            im = im.convert("RGB")
        
        buf = BytesIO()
        im.save(buf, format="PNG")  # ← 改成 PNG
        buf.seek(0)
        
        return Response(buf.getvalue(), media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        log.exception("imagemap build failed: %s", e)
        raise HTTPException(status_code=500, detail=f"image build failed: {e}")

@app.get("/imgmap/categories/{size}.png")
def imagemap_categories_jpg(size: int):
    return imagemap_categories(size)

# ---------- Load data & normalize links ----------
PLACES = settings.load_places()
log.info("[BOOT] DATA_SIZE=%d files=%s",
         len(PLACES), [str(p) for p in settings.iter_place_files()])

for p in PLACES:
    g = p.get("geo") or {}
    p["gmaps"] = normalize_existing_gmaps(
        p.get("gmaps"),
        name=p.get("name"),
        lat=(float(g.get("lat")) if g.get("lat") is not None else None),
        lng=(float(g.get("lng")) if g.get("lng") is not None else None),
        place_id=p.get("place_id"),
    )

# ---------- LINE SDK ----------
CHANNEL_SECRET = settings.channel_secret
CHANNEL_TOKEN  = settings.channel_access_token
SKIP_VERIFY    = settings.should_skip_verify

configuration = Configuration(access_token=CHANNEL_TOKEN)
api_client = ApiClient(configuration)
msg_api = MessagingApi(api_client)
parser = WebhookParser(CHANNEL_SECRET)

log.info("[BOOT] ENV=%s SKIP_VERIFY=%s SECRET_SET=%s TOKEN_SET=%s DATA_SIZE=%d",
         settings.env, SKIP_VERIFY, bool(CHANNEL_SECRET), bool(CHANNEL_TOKEN), len(PLACES))

# ---------- Small utils ----------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return 2 * R * asin(sqrt(a))  # km

def pick_by_location(lat: float | None, lng: float | None, now: datetime) -> str:
    if lat is None or lng is None:
        return "沒有取得你的定位，請再傳一次位置訊息～"
    if not PLACES:
        return "目前景點資料尚未載入，請稍後再試～"

    def _dist_km(p):
        g = p.get("geo") or {}
        plat, plng = g.get("lat"), g.get("lng")
        if plat is None or plng is None:
            return None
        return haversine(lat, lng, float(plat), float(plng))

    def _top1_by_type(t):
        cand = [p for p in PLACES if p.get("type") == t]
        cand = [(p, _dist_km(p)) for p in cand]
        cand = [(p, d) for p, d in cand if d is not None]
        cand.sort(key=lambda x: x[1])
        return cand[0][0] if cand else None

    walk = _top1_by_type("walk")
    cafe = _top1_by_type("cafe")
    special = _top1_by_type("spot") or _top1_by_type("event")

    def _pack(p): return f"{p['name']}\n{p['gmaps']}"

    parts = []
    if walk:   parts.append("🚶 散步（就近）：\n" + _pack(walk))
    if cafe:   parts.append("☕ 咖啡廳（就近）：\n" + _pack(cafe))
    if special:parts.append("🎯 景點（就近）：\n" + _pack(special))
    return "\n\n".join(parts) or "附近暫時找不到帶座標的景點，請先輸入行政區名稱查詢～"

def pick_suggestions(district: str | None, now: datetime) -> str:
    if not PLACES:
        return "目前景點資料尚未載入，請稍後再試～"

    def _pack(p): return f"{p['name']}\n{p['gmaps']}"
    if not district:
        return "請輸入或點選行政區，例如「信義區／西屯區／苓雅區」～"

    def filt_by_type(t):
        return [p for p in PLACES if p.get("type") == t and p.get("district") == district]

    walk = filt_by_type("walk")[:1]
    cafe = filt_by_type("cafe")[:1]
    special = (filt_by_type("spot")[:1]) or (
        [p for p in PLACES if p.get("type") == "event" and p.get("district") == district][:1]
    )

    if not (walk or cafe or special):
        possible_cities = {p.get("city") for p in PLACES if p.get("district") == district}
        city = next(iter(possible_cities), None) or {
            # 簡易映射
            "信義區":"台北","大安區":"台北","中正區":"台北","松山區":"台北","萬華區":"台北","大同區":"台北",
            "中山區":"台北","內湖區":"台北","南港區":"台北","士林區":"台北","北投區":"台北","文山區":"台北",
            "西屯區":"台中","北屯區":"台中","南屯區":"台中","中區":"台中","西區":"台中","北區":"台中",
            "東區":"台中","南區":"台中","太平區":"台中","大里區":"台中","霧峰區":"台中","烏日區":"台中",
            "鹽埕區":"高雄","鼓山區":"高雄","三民區":"高雄","苓雅區":"高雄","前金區":"高雄","新興區":"高雄",
            "前鎮區":"高雄","左營區":"高雄","楠梓區":"高雄","小港區":"高雄","鳳山區":"高雄","仁武區":"高雄",
        }.get(district)

        if city:
            def filt_city_type(t): return [p for p in PLACES if p.get("type") == t and p.get("city") == city]
            walk = walk or filt_city_type("walk")[:1]
            cafe = cafe or filt_city_type("cafe")[:1]
            special = special or filt_city_type("spot")[:1] or filt_city_type("event")[:1]

    parts = []
    if walk:   parts.append("🚶 散步：\n" + _pack(walk[0]))
    if cafe:   parts.append("☕ 咖啡廳：\n" + _pack(cafe[0]))
    if special:parts.append("🎯 景點：\n" + _pack(special[0]))
    return "\n\n".join(parts) if parts else \
        f"「{district}」目前沒有資料，看起來你尚未匯入該城市的清單。"

def _to_float(v):
    try:
        if v is None: 
            return None
        s = str(v).strip()
        if s == "":
            return None
        return float(s)
    except (TypeError, ValueError):
        return None

def reply_places_list(reply_token: str, city: str, district: str, category: str,
                      page: int = 1, page_size: int = 6):
    res = filter_places(city, district, category, page=page, page_size=page_size)
    items = res.get("items", [])

    # ✅ 在這裡統一把 gmaps 轉成 google.com/maps 正式連結
    for p in items:
        g = p.get("geo") or {}
        p["gmaps"] = normalize_existing_gmaps(
            p.get("gmaps"),
            name=p.get("name"),
            lat=_to_float(g.get("lat")),
            lng=_to_float(g.get("lng")),
            place_id=p.get("place_id"),
        )

    if not items:
        send_reply_if_needed(reply_token, f"{city}{district} 目前沒有「{CATEGORY_LABELS.get(category, category)}」資料，換個類別看看？")
        return

    bubbles = [bubble_from_place(p) for p in items]
    contents = bubbles[0] if len(bubbles) == 1 else {"type": "carousel", "contents": bubbles}

    alt = f"{city}{district}｜{CATEGORY_LABELS.get(category, category)}（第 {page} 頁）"
    flex_msg = FlexMessage.from_dict({
        "type": "flex",
        "altText": alt,
        "contents": contents
    })
    msg_api.reply_message(ReplyMessageRequest(replyToken=reply_token, messages=[flex_msg]))

def send_reply_if_needed(reply_token: str, text: str):
    is_fake_token = (not reply_token) or reply_token.startswith("0000")
    is_dev = SKIP_VERIFY or (not CHANNEL_TOKEN)
    if is_dev or is_fake_token:
        log.info("(dev) skip LINE reply. text=%s", text)
        return
    try:
        msg_api.reply_message(
            ReplyMessageRequest(replyToken=reply_token, messages=[TextMessage(text=text)])
        )
    except Exception as e:
        log.exception("Reply failed (skip second reply): %s", e)

# ---------- Webhook（容錯版） ----------
def _valid_sig(body: bytes, sig: str | None) -> bool:
    try:
        if not CHANNEL_SECRET or not sig:
            return False
        mac = hmac.new(CHANNEL_SECRET.encode("utf-8"), body, hashlib.sha256).digest()
        expected = b64encode(mac).decode("utf-8")
        return hmac.compare_digest(expected, sig)
    except Exception:
        return False
    
# ---------- 安全回覆工具 ----------
def safe_reply_or_push(msg_api, event, reply_tok: str, messages: list):
    """
    先嘗試 reply；若遇到 Invalid reply token (400) 就改用 push。
    回傳 True 代表已送出任一種訊息。
    """
    try:
        msg_api.reply_message(ReplyMessageRequest(replyToken=reply_tok, messages=messages))
        return True
    except ApiException as e:
        # 解析 400 Invalid reply token → fallback to push
        try:
            body = getattr(e, "body", "") or getattr(e, "reason", "")
            if e.status == 400 and "Invalid reply token" in str(body):
                # 取 userId
                user_id = None
                # v3 event 物件
                user_id = getattr(getattr(event, "source", None), "user_id", None) or user_id
                # raw dict（若你是自己組的 ev）
                if not user_id and isinstance(event, dict):
                    user_id = event.get("source", {}).get("userId")

                if user_id:
                    msg_api.push_message(PushMessageRequest(to=user_id, messages=messages))
                    return True
        except Exception:
            pass
        # 其他錯誤或無 userId，就回傳 False，讓呼叫端決定要不要補一則錯誤文案
        return False
    
# 同一個 handler 綁多條常見路徑（含結尾斜線），避免路徑不一致
@app.post("/webhook")
async def webhook(request: Request):
    body_bytes = await request.body()
    body_text  = body_bytes.decode("utf-8") if body_bytes else ""
    signature  = request.headers.get("X-Line-Signature") or request.headers.get("x-line-signature")

    log.info("[webhook] skip=%s sig_present=%s body_prefix=%s",
             SKIP_VERIFY, bool(signature), body_text[:80])

    # A) 開發/驗證期：直接 200
    if SKIP_VERIFY:
        return {"ok": True, "skip_verify": True}

    # B) 只做 HMAC 簽章驗證，不先假設是 JSON
    if not _valid_sig(body_bytes, signature):
        log.warning("Invalid signature (verify will still get 200).")
        # 關鍵：仍回 200，避免 LINE Verify/重試造成 4xx 風暴
        return {"ok": False, "reason": "invalid-signature"}

    # C) 簽章正確 → 再嘗試解析 JSON；Verify 常不是 JSON 或沒有 events，也算成功
    try:
        data = json.loads(body_text) if body_text else {}
    except json.JSONDecodeError:
        log.info("Verified non-JSON payload (likely Verify ping).")
        return {"ok": True, "note": "non-json-verified"}

    # 沒有 events 也當成功（Verify 常見）
    if not isinstance(data, dict) or "events" not in data:
        log.info("Verified request without events (likely Verify).")
        return {"ok": True, "note": "no-events"}

    events = data.get("events", [])

    # ----以下是你原本的事件處理邏輯（保持不變）----
    for ev in events:
        ev_type   = ev.get("type") if isinstance(ev, dict) else getattr(ev, "type", None)
        ev_msg    = ev.get("message") if isinstance(ev, dict) else getattr(ev, "message", None)
        reply_tok = ev.get("replyToken") if isinstance(ev, dict) else getattr(ev, "reply_token", "")

        if ev_type == "message" and (ev_msg.get("type") if isinstance(ev_msg, dict) else getattr(ev_msg, "type", "")) == "location":
            lat = (ev_msg.get("latitude") if isinstance(ev_msg, dict) else getattr(ev_msg, "latitude", None))
            lng = (ev_msg.get("longitude") if isinstance(ev_msg, dict) else getattr(ev_msg, "longitude", None))
            send_reply_if_needed(reply_tok, pick_by_location(lat, lng, datetime.now()))
            continue

        if ev_type == "message":
            t = (ev_msg.get("text", "") if isinstance(ev_msg, dict) else getattr(ev_msg, "text", "")).strip()
            if not t:
                continue
            
            # === 今日推薦 ===
            if t in ("/today", "今日推薦"):
                try:
                    msg = create_today_pick_message()  # FlexMessage 物件
                    if not msg:
                        safe_reply_or_push(msg_api, ev, reply_tok, [TextMessage(text="目前沒有可推薦的景點，稍後再試看看！")])
                    else:
                        safe_reply_or_push(msg_api, ev, reply_tok, [msg])
                except Exception as e:
                    log.exception("Send today-pick failed: %s", e)
                    safe_reply_or_push(msg_api, ev, reply_tok, [TextMessage(text="今日推薦好像卡住了，等我一下再試 🙏")])
                continue  # ← 務必保留，避免同一事件再次回覆

            # === 吃什麼輪盤 ===
            if t in ("輪盤", "吃什麼", "/eat"):
                try:
                    msg = create_food_roulette_message(city="台北", district="信義區")
                    safe_reply_or_push(msg_api, ev, reply_tok, [msg])
                except Exception as e:
                    log.exception("Send food-roulette failed: %s", e)
                    safe_reply_or_push(msg_api, ev, reply_tok, [TextMessage(text="轉盤好像卡住了，等我一下再轉 🙏")])
                continue

            if t.startswith("CAT|"):
                try:
                    _, city, district, category, page_str = t.split("|", 4)
                    page = int(page_str) if page_str.isdigit() else 1
                    reply_places_list(reply_tok, city, district, category, page=page)
                except Exception as e:
                    log.exception("Parse CAT payload failed: %s", e)
                    send_reply_if_needed(reply_tok, "讀取類別失敗，請再點一次類別 🙏")
                continue

            if t in ("開始", "start", "hi", "hello", "嗨", "您好"):
                try:
                    msg = create_city_selection_message()
                    msg_api.reply_message(ReplyMessageRequest(replyToken=reply_tok, messages=[msg]))
                except Exception as e:
                    log.exception("Send city selection failed: %s", e)
                continue

            m = re.match(r"^(台北|新北|台中|高雄)(?:#p(\d+))?$", t)
            if m:
                city = m.group(1)
                page = int(m.group(2) or "1")
                try:
                    msg = create_district_selection_message(city, page=page)
                    msg_api.reply_message(ReplyMessageRequest(replyToken=reply_tok, messages=[msg]))
                except Exception as e:
                    log.exception("Send district selection failed: %s", e)
                continue

            ALL_DISTRICTS = {d for ds in DISTRICTS_MAP.values() for d in ds}
            if t in ALL_DISTRICTS or (t.endswith("區") and 2 <= len(t) <= 4):
                city = next((c for c, ds in DISTRICTS_MAP.items() if t in ds), None) or (settings.city_default or "台北")
                try:
                    msg = make_category_imagemap(city, t)
                    msg_api.reply_message(ReplyMessageRequest(replyToken=reply_tok, messages=[msg]))
                except Exception as e:
                    log.exception("Send category imagemap (by district text) failed: %s", e)
                continue

            district_set = {p.get("district") for p in PLACES if p.get("district")}
            if t in district_set or (t.endswith("區") and 2 <= len(t) <= 4):
                send_reply_if_needed(reply_tok, pick_suggestions(t, datetime.now()))
                continue
            
        if ev_type == "postback":
            if isinstance(ev, dict):
                pb = ev.get("postback") or {}
                data_str = (pb.get("data") or "").strip()
                reply_tok = ev.get("replyToken") or reply_tok
            else:
                pb = getattr(ev, "postback", None)
                data_str = getattr(pb, "data", "") if pb else ""
            try:
                pdata = json.loads(data_str) if data_str else {}
            except Exception:
                pdata = {}

            action = pdata.get("action")
            if action == "select_district":
                city = pdata.get("city"); district = pdata.get("district")
                try:
                    msg = make_category_imagemap(city, district)
                    msg_api.reply_message(ReplyMessageRequest(replyToken=reply_tok, messages=[msg]))
                except Exception as e:
                    log.exception("Send category imagemap failed: %s", e)
                continue

            if action in ("select_category", "list_next"):
                city = pdata.get("city"); district = pdata.get("district")
                category = pdata.get("category"); page = int(pdata.get("page", 1))
                try:
                    reply_places_list(reply_tok, city, district, category, page=page)
                except Exception as e:
                    log.exception("Reply places list failed: %s", e)
                continue

    return {"ok": True}


# ---------- Health ----------
@app.get("/")
def root():
    return {"ok": True, "msg": "今天去哪兒 LINE Bot is running."}

@app.get("/healthz")
def health():
    return {"status": "ok"}
