from __future__ import annotations
import random
from typing import Dict, Any, List, Optional, Tuple
from app.services.places import filter_places  # 你現有的過濾函式

def pick_today_place(
    city: Optional[str] = None,
    district: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 1,
) -> List[Dict[str, Any]]:
    """
    從既有資料挑出今日推薦景點，預設隨機 1 筆。
    注意：不要把 limit 傳給 filter_places（它沒有這參數）。
    """
    # 若 filter_places 回傳 generator，先轉成 list；若回傳 list，這行也 OK
    candidates = list(filter_places(city=city, district=district, category=category))
    if not candidates:
        return []

    random.shuffle(candidates)
    return candidates[: max(1, limit)]
