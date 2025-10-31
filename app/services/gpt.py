# app/services/ai.py
from __future__ import annotations
import os, asyncio
from typing import Literal, Optional
from openai import OpenAI


# 可從環境或外部注入
_OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
_client = OpenAI(api_key=_OPENAI_API_KEY) if _OPENAI_API_KEY else None

# LINE 單則文字訊息建議上限
_MAX_LINE_TEXT = 1900

Mode = Literal["summary", "translate", "rewrite", None]

def _system_by_mode(mode: Mode) -> str:
    base = "你是友善、精簡的繁體中文助理。"
    if mode == "summary":
        return "請用繁體中文條列精準摘要（不超過 8 點）。"
    if mode == "translate":
        return "把使用者文字翻成流暢的繁體中文，保留專有名詞。"
    if mode == "rewrite":
        return "將使用者文字改寫得更清楚、精煉、正式，保留原意。"
    return base

async def generate_text(
    user_text: str,
    *,
    mode: Mode = None,
    model: str = "gpt-5",
    system_override: Optional[str] = None,
) -> str:
    """產生文字回覆；若未設定 API key，回覆友善提示。"""
    if not _client:
        return "尚未設定 OPENAI_API_KEY，暫時無法使用 GPT 功能。"

    system = system_override or _system_by_mode(mode)

    # 放到 thread，避免阻塞 event loop
    def _call():
        return _client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_text},
            ],
        )

    try:
        resp = await asyncio.to_thread(_call)
        text = (getattr(resp, "output_text", None) or "").strip() or "我在，請再說一次～"
    except Exception as e:
        # 這裡可加 logger
        text = "目前有點塞車，稍後再試一次～"

    # 安全裁切，避免超過 LINE 限制
    if len(text) > _MAX_LINE_TEXT:
        text = text[:_MAX_LINE_TEXT] + "\n…（內容過長已截斷）"
    return text
