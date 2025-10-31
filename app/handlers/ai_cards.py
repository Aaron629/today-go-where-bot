# app/handlers/ai_cards.py
from __future__ import annotations

def itinerary_flex(
    title: str,
    subtitle: str | None,
    tags: list[str] | None,
    sections: list[dict],
):
    """
    sections 範例：
    [
      {"title":"上午","items":[
         "淺水灣 — 海景咖啡放空 60–90 分鐘",
         "白沙灣 — 散步踏浪、拍照"
      ]},
      {"title":"中午","items":[
         "金山老街 — 鴨肉/石花凍/地瓜",
      ]},
      {"title":"下午","items":[
         "野柳地質公園 — 女王頭、蕈狀岩，注意防曬"
      ]},
      {"title":"傍晚/晚餐","items":[
         "龜吼漁港 — 逛魚市吃海鮮，或沿路看夕陽"
      ]}
    ]
    """
    tag_nodes = []
    for t in (tags or []):
        tag_nodes.append({
            "type":"box","layout":"vertical","paddingAll":"6px","cornerRadius":"999px",
            "backgroundColor":"#F0F4FF","contents":[
                {"type":"text","text":t,"size":"xs","weight":"bold","color":"#1E3A8A","wrap":False}
            ]
        })

    section_nodes = []
    for sec in sections:
        section_nodes.append({"type":"text","text":f"• {sec['title']}", "weight":"bold", "size":"sm"})
        for line in sec.get("items", []):
            section_nodes.append({
                "type":"text","text":f"  – {line}", "size":"sm", "wrap":True
            })
        section_nodes.append({"type":"separator","margin":"md"})

    # 去掉最後一條 separator
    if section_nodes and section_nodes[-1].get("type") == "separator":
        section_nodes.pop()

    bubble = {
      "type":"bubble",
      "header":{
        "type":"box","layout":"vertical","paddingAll":"16px","contents":[
          {"type":"text","text":title,"weight":"bold","size":"lg","wrap":True},
          {"type":"text","text":subtitle or "", "size":"sm", "color":"#6B7280", "wrap":True}
        ]
      },
      "body":{
        "type":"box","layout":"vertical","spacing":"sm","contents":[
          {
            "type":"box","layout":"horizontal","spacing":"sm","flex":0,"contents":tag_nodes
          },
          {"type":"separator","margin":"md"},
          *section_nodes
        ]
      },
      "footer":{
        "type":"box","layout":"vertical","contents":[
          {"type":"text","text":"今天去哪兒 · AI 行程建議","size":"xs","color":"#9CA3AF"}
        ]
      },
      "styles":{"header":{"backgroundColor":"#F9FAFB"}}
    }
    return bubble

def _pill(text: str, color="#EEF2FF", fg="#1E3A8A"):
    return {
        "type":"box","layout":"vertical","paddingAll":"6px","cornerRadius":"999px",
        "backgroundColor":color,"contents":[
            {"type":"text","text":text,"size":"xs","weight":"bold","color":fg,"wrap":False}
        ]
    }

def cafe_list_flex(
    title: str,
    subtitle: str | None,
    cafes: list[dict],
):
    """
    cafes: 每筆範例
    {
      "name": "Simple Kaffa",
      "district": "信義區",
      "price": "≈150–250",
      "time": "13:00–21:00",
      "features": ["插座", "Wi-Fi", "不限時"],
      "tags": ["手沖", "甜點不錯"],
      "gmaps": "https://maps.app.goo.gl/?q=...",
    }
    """
    rows = []
    for c in cafes:
        head = f"{c.get('name','')}" + (f"｜{c.get('district','')}" if c.get("district") else "")
        sub  = "・".join([p for p in [
            c.get("price"),
            c.get("time"),
            " / ".join(c.get("features", [])) if c.get("features") else None,
        ] if p])

        # 每家店一個小區塊
        item_box = {
          "type":"box","layout":"vertical","spacing":"sm","contents":[
            {"type":"text","text":head,"weight":"bold","size":"sm","wrap":True},
            {"type":"text","text":sub or "", "size":"xs","color":"#6B7280","wrap":True},
          ]
        }

        # 店內標籤
        tag_nodes = [_pill(t) for t in (c.get("tags") or [])][:4]
        if tag_nodes:
            item_box["contents"].append({
              "type":"box","layout":"horizontal","spacing":"sm","flex":0,"contents":tag_nodes
            })

        # 連結列（如果有 gmaps）
        if c.get("gmaps"):
            item_box["contents"].append({
              "type":"button","style":"link","height":"sm",
              "action":{"type":"uri","label":"地圖與路線","uri":c["gmaps"]}
            })

        rows.extend([item_box, {"type":"separator","margin":"md"}])

    if rows and rows[-1].get("type") == "separator":
        rows.pop()

    bubble = {
      "type":"bubble",
      "header":{
        "type":"box","layout":"vertical","paddingAll":"16px","contents":[
          {"type":"text","text":title,"weight":"bold","size":"lg","wrap":True},
          {"type":"text","text":subtitle or "", "size":"sm","color":"#6B7280","wrap":True}
        ]
      },
      "body":{
        "type":"box","layout":"vertical","spacing":"md","contents": rows or [
            {"type":"text","text":"目前沒有符合的咖啡店，換個區或條件再試看看～","size":"sm","color":"#6B7280"}
        ]
      },
      "footer":{
        "type":"box","layout":"vertical","contents":[
          {"type":"text","text":"今天去哪兒 · 咖啡放鬆清單","size":"xs","color":"#9CA3AF"}
        ]
      },
      "styles":{"header":{"backgroundColor":"#F9FAFB"}}
    }
    return bubble