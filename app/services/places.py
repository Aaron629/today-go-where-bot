import json
from functools import lru_cache
from app.utils.category import to_category

@lru_cache
def load_places():
    paths = [
        "app/data/taipei.json",
        "app/data/newtaipei.json",
        "app/data/taichung.json",
        "app/data/kaohsiung.json",
    ]
    rows = []
    for p in paths:
        try:
            with open(p, "r", encoding="utf-8") as f:
                chunk = json.load(f)
                if isinstance(chunk, list):
                    rows.extend(chunk)
        except FileNotFoundError:
            pass
    return rows

def get_categories_by_district(city: str, district: str) -> list[str]:
    cats = {to_category(x) for x in load_places()
            if x.get("city")==city and x.get("district")==district}
    return sorted(cats)

def filter_places(city: str, district: str, category: str|None, page:int=1, page_size:int=6):
    data = [x for x in load_places() if x.get("city")==city and x.get("district")==district]
    if category:
        data = [x for x in data if to_category(x)==category]
    total = len(data)
    start = (page-1)*page_size
    end = start + page_size
    return {"items": data[start:end], "total": total, "page": page, "has_next": end < total}
