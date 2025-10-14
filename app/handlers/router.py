from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import PlainTextResponse
from linebot.exceptions import InvalidSignatureError
from services.places import filter_places
from handlers.replies import make_category_imagemap, make_category_imagemap, bubble_from_place
from utils.category import CATEGORY_LABELS
from linebot.models import PostbackEvent, FlexSendMessage, TextSendMessage
from handlers.replies import make_category_imagemap, bubble_from_place  # + make_district_imagemap
from services.places import filter_places
from app.utils.category import CATEGORY_LABELS
import json

router = APIRouter()

@router.get("/callback", response_class=PlainTextResponse)
async def callback_healthcheck():
    return "OK"

@router.post("/callback", response_class=PlainTextResponse)
async def callback(request: Request):
    signature = request.headers.get("X-Line-Signature", "")
    body = (await request.body()).decode("utf-8")
    try:
        # handler.handle(...) 如你原本寫的
        ...
    except InvalidSignatureError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    return "OK"

def on_postback(event: PostbackEvent):
    try:
        data = json.loads(event.postback.data)
    except Exception:
        return
    act = data.get("action")
    if act == "select_city":
        # districts = [...]
        # msg = make_district_imagemap(data["city"], districts, page=1)
        # line_bot_api.reply_message(event.reply_token, msg)
        return
    if act == "select_district":
        msg = make_category_imagemap(data["city"], data["district"])
        line_bot_api.reply_message(event.reply_token, msg)
        return
    if act in {"select_category","list_next"}:
        city, district, cat = data["city"], data["district"], data["category"]
        page = int(data.get("page", 1))
        r = filter_places(city, district, cat, page=page, page_size=6)
        bubbles = [bubble_from_place(p) for p in r["items"]]
        contents = {"type":"carousel","contents":bubbles} if len(bubbles)>1 else bubbles[0]
        msgs = [FlexSendMessage(alt_text=f"{city}{district}｜{CATEGORY_LABELS.get(cat,cat)}", contents=contents)]
        if r["has_next"]:
            msgs.append(TextSendMessage(text="還要看更多嗎？（下一頁）"))
        line_bot_api.reply_message(event.reply_token, msgs)