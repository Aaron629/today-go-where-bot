from __future__ import annotations
import random
from typing import Dict, Any

# 可日後改成從 DB/設定檔載入
FOOD_TYPES = [
    "日式拉麵 🍜", "火鍋 🍲", "便當 🍱", "燒烤 🍖",
    "牛排 🥩", "壽司 🍣", "韓式料理 🍗", "炸雞 🍗",
    "滷肉飯 🍚", "漢堡 🍔", "咖哩 🍛", "沙拉 🥗",
]

def spin_food_roulette(city: str = "台北", district: str = "信義區") -> Dict[str, str]:
    """回傳本次抽到的餐點類型與 Google 地圖搜尋連結"""
    choice = random.choice(FOOD_TYPES)
    # 取去掉 emoji 的關鍵詞（以空格分隔，第一段是文字）
    keyword = choice.split()[0]
    gmaps = f"https://www.google.com/maps/search/{district}+{keyword}"
    return {"food": choice, "gmaps": gmaps}
