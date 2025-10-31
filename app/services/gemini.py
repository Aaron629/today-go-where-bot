# app/services/gemini.py
import google.generativeai as genai
from app.config.settings import settings
import asyncio

genai.configure(api_key=settings.gemini_api_key)

async def generate_text(prompt: str) -> str:
    """
    最小測試版本：直接把使用者輸入交給 Gemini，回傳生成文字。
    """
    model_id = settings.gemini_model or "models/gemini-2.0-flash"
    model = genai.GenerativeModel(model_id)

    try:
        # Gemini 的 SDK 是同步的，用 asyncio.to_thread 包起來
        resp = await asyncio.to_thread(model.generate_content, prompt)
        return (resp.text or "").strip()
    except Exception as e:
        return f"Gemini 呼叫失敗：{e!s}"
