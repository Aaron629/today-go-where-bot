# replies.py（全 v3 版本）
from linebot.v3.messaging import (
    TextMessage,
    QuickReply, QuickReplyItem, MessageAction,
    ImagemapMessage, ImagemapBaseSize, ImagemapArea, ImagemapAction,MessageImagemapAction,
)
import json
from app.utils.category import CATEGORY_LABELS, to_category
from app.config.settings import settings
from urllib.parse import quote
import os

# 各城市 → 行政區清單
DISTRICTS_MAP = {
    "台北": ["中正區","大同區","中山區","松山區","大安區","萬華區","信義區","士林區","北投區","內湖區","南港區","文山區"],
    "新北": ["板橋區","三重區","中和區","永和區","新莊區","新店區","樹林區","鶯歌區","三峽區","淡水區","汐止區","瑞芳區","土城區","蘆洲區","五股區","泰山區","林口區","八里區","深坑區","石碇區","坪林區","三芝區","石門區"],
    "台中": ["中區","東區","南區","西區","北區","西屯區","南屯區","北屯區","豐原區","東勢區","大甲區","清水區","沙鹿區","梧棲區","后里區","神岡區","潭子區","大雅區","新社區","石岡區","外埔區","大安區","烏日區","大里區","霧峰區","太平區","大肚區","龍井區","和平區"],
    "高雄": ["新興區","前金區","苓雅區","鹽埕區","鼓山區","旗津區","前鎮區","三民區","楠梓區","小港區","左營區","仁武區","大社區","岡山區","路竹區","阿蓮區","田寮區","燕巢區","橋頭區","梓官區","彌陀區","永安區","湖內區","鳳山區","大寮區","林園區","鳥松區","大樹區","旗山區","美濃區","六龜區","甲仙區","杉林區","內門區","茂林區","桃源區","那瑪夏區"]
}

# Quick Reply 限制：最多 13 個 item（含導覽鈕）
MAX_ITEMS = 13
PAGE_BODY_WHEN_BOTH_NAV = 11
PAGE_BODY_WHEN_ONE_NAV  = 12
PAGE_BODY_WHEN_NO_NAV   = 13

def _paginate(items, page, body_size):
    start = (page-1)*body_size
    end   = start + body_size
    return items[start:end]

def create_city_selection_message():
    """建立城市選擇的 Quick Reply（文字→再出行政區選單）"""
    quick_reply = QuickReply(items=[
        QuickReplyItem(action=MessageAction(label="🏙️ 台北", text="台北")),
        QuickReplyItem(action=MessageAction(label="🏙️ 新北", text="新北")),
        QuickReplyItem(action=MessageAction(label="🌆 台中", text="台中")),
        QuickReplyItem(action=MessageAction(label="🌇 高雄", text="高雄")),
    ])
    return TextMessage(text="請選擇你想探索的城市 🗺️", quick_reply=quick_reply)

def create_district_selection_message(city: str, page: int = 1) -> TextMessage:
    city = city.strip()
    districts = DISTRICTS_MAP.get(city)
    if not districts:
        return TextMessage(text=f"目前不支援「{city}」。請選：台北 / 新北 / 台中 / 高雄")

    total = len(districts)
    has_prev = page > 1

    # 預估兩顆導覽鈕
    body_size = PAGE_BODY_WHEN_BOTH_NAV
    page_items = _paginate(districts, page, body_size)
    has_next = (page * body_size) < total

    # 依實際導覽鈕數量微調當頁容量
    if has_prev and not has_next:
        body_size = PAGE_BODY_WHEN_ONE_NAV
        page_items = _paginate(districts, page, body_size)
    elif not has_prev and has_next:
        body_size = PAGE_BODY_WHEN_ONE_NAV
        page_items = _paginate(districts, page, body_size)
    elif not has_prev and not has_next:
        body_size = PAGE_BODY_WHEN_NO_NAV
        page_items = _paginate(districts, page, body_size)

    qr_items = [QuickReplyItem(action=MessageAction(label=d, text=d)) for d in page_items]

    if has_prev:
        qr_items.append(QuickReplyItem(action=MessageAction(label="◀ 上一頁", text=f"{city}#p{page-1}")))
    if has_next:
        qr_items.append(QuickReplyItem(action=MessageAction(label="下一頁 ▶", text=f"{city}#p{page+1}")))

    qr_items = qr_items[:MAX_ITEMS]
    title = f"請選擇「{city}」行政區（第 {page} 頁）" if (has_prev or has_next) else f"請選擇「{city}」行政區"
    return TextMessage(text=title, quick_reply=QuickReply(items=qr_items))


def make_category_imagemap(city: str, district: str) -> ImagemapMessage:
    size = ImagemapBaseSize(height=1040, width=1040)
    W, H = 520, 346
    rects = [
        (0,   0,   "landmark"),
        (520, 0,   "museum"),
        (0,   346, "park_walk"),
        (520, 346, "food_market"),
        (0,   692, "temple_history"),
        (520, 692, "family_fun"),
    ]

    actions = []
    for x, y, cat in rects:
        payload = f"CAT|{city}|{district}|{cat}|1"
        actions.append(
            MessageImagemapAction(               # ← 專屬子類
                text=payload,
                area=ImagemapArea(
                    x=int(x), y=int(y), width=int(W), height=int(H)
                )
            )
        )

    # base_url = settings.asset_base_url.rstrip("/") + "/categories_1040_grid.png"
    base_url = os.getenv("ASSET_BASE_URL", "https://today-go-where-api-898860726599.asia-east1.run.app/imgmap/categories")
    return ImagemapMessage(
        base_url=base_url,                      # 必須是可公開 HTTPS 圖
        alt_text=f"{city}{district}｜請選擇類別",
        base_size=size,
        actions=actions
    )



def _pick_image_url(p: dict) -> str:
    """回傳可供 LINE 顯示的圖片網址：優先用 p['image_url']，否則給備援。"""
    url = (p.get("image_url") or "").strip()

    # 1) 強制 HTTPS（LINE 要求）
    if url.startswith("http://"):
        url = "https://" + url[len("http://"):]

    # 2) 沒提供或是空字串 → 備援圖
    if not url:
        # 你的自家 CDN/靜態圖（建議）
        # return settings.asset_base_url.rstrip("/") + "/assets/places/default_hero.jpg"

        # 或暫用 Unsplash Source（關鍵字：城市 + 名稱）
        q = f"{p.get('city','')} {p.get('name','')}".strip()
        url = f"https://source.unsplash.com/featured/?{quote(q)}"

    return url

def bubble_from_place(p: dict) -> dict:
    return {
      "type": "bubble",
      "hero": {
        "type": "image",
        "url": _pick_image_url(p),   # ← 這裡改成用你的 image_url
        "size": "full",
        "aspectRatio": "20:13",
        "aspectMode": "cover",
        "action": {"type": "uri", "label": "地圖", "uri": p.get("gmaps", "https://maps.google.com")}
      },
      "body": {
        "type": "box", "layout": "vertical",
        "contents": [
          {"type": "text", "text": p.get("name", ""), "weight": "bold", "size": "lg", "wrap": True},
          {"type": "text", "text": p.get("description", ""), "size": "sm", "wrap": True, "color": "#666666"},
          {"type": "box", "layout": "baseline", "margin": "md", "contents": [
            {"type": "text", "text": "類別", "size": "sm", "color": "#999999"},
            {"type": "text", "text": CATEGORY_LABELS.get(to_category(p), "其他"), "size": "sm", "margin": "sm"}
          ]}
        ]
      },
      "footer": {
        "type": "box", "layout": "vertical", "spacing": "sm",
        "contents": [
          {"type": "button", "style": "primary", "height": "sm",
           "action": {"type": "uri", "label": "在地圖開啟", "uri": p.get("gmaps", "https://maps.google.com")}}
        ]
      }
    }

