CATEGORY_LABELS = {
  "landmark": "地標/拍照",
  "museum": "博物館/美術館",
  "park_walk": "公園/步道",
  "food_market": "美食/夜市",
  "temple_history": "寺廟/古蹟",
  "family_fun": "親子/農場/樂園",
}

def to_category(item: dict) -> str:
    t = (item.get("type") or "").lower()
    tags = {x.lower() for x in item.get("tags", [])}
    if t in {"museum"} or tags & {"博物館","美術館","展覽","文化","藝術"}:
        return "museum"
    if t in {"food","shop"} or tags & {"夜市","小吃","美食","商圈","市場"}:
        return "food_market"
    if tags & {"親子","樂園","動物"}:
        return "family_fun"
    if t in {"walk","nature","family"} or tags & {"公園","步道","自然","生態","湖景"}:
        return "park_walk"
    if tags & {"寺廟","古蹟","宗教","歷史"}:
        return "temple_history"
    if t in {"spot"} or tags & {"地標","拍照","建築","觀景","夜景"}:
        return "landmark"
    return "landmark"
