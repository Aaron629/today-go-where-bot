# app/services/gemini.py
import os
import asyncio
import google.generativeai as genai
from app.config.settings import settings
import logging

# 設定日誌
logging.basicConfig(level=logging.INFO)

# --- 強制只走 API Key 路徑，避免被 ADC 影響 ---
os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)  # 防止走服務帳戶
os.environ.pop("GOOGLE_AUTH_SUPPRESS_CREDENTIALS_WARNING", None)  # 乾淨一點

API_KEY = (settings.gemini_api_key or "").strip()
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY 未設定或為空，請設定 settings.gemini_api_key")

# !!! DEBUG 步驟 A: 檢查 API 金鑰是否正確讀取 (僅在部署環境中執行) !!!
# 警告: 請不要在正式 Log 中印出完整的 API Key，這裡只印出長度供檢查。
logging.info(f"DEBUG: Gemini API Key 讀取成功, 長度: {len(API_KEY)}")

genai.configure(api_key=API_KEY)

# SDK 慣例用 "model_name"；且多數情況不需要 "models/" 前綴
MODEL_NAME = (settings.gemini_model or "gemini-1.5-flash").strip()

async def generate_text(prompt: str) -> str:
    """
    最小測試版本：直接把使用者輸入交給 Gemini，回傳生成文字。
    """
    model = genai.GenerativeModel(model_name=MODEL_NAME)

    try:
        # SDK 同步 → 丟到 thread 執行，避免阻塞
        resp = await asyncio.to_thread(model.generate_content, prompt)

        # 安全擷取文字
        text = getattr(resp, "text", None) or ""
        return text.strip()

    except Exception as e:
        # 回傳可讀錯誤，並在 server log 另行記錄完整堆疊
        # 由於您回報的錯誤帶有 'generativelanguage.googleapis.com' 服務名稱，
        # 即使程式碼使用 google-genai SDK (API Key)，它仍可能在內部被覆寫為 Vertex AI 的驗證路徑。
        logging.error(f"Gemini 呼叫失敗，完整錯誤：{e}", exc_info=True)
        return f"Gemini 呼叫失敗：{e!s}"
