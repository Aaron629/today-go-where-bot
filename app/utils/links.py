# app/utils/links.py
from __future__ import annotations
from urllib.parse import urlparse, parse_qs, quote_plus
from typing import Optional

GOOGLE_MAPS_HOSTS = {"www.google.com", "google.com"}
SHORTENER_HOSTS = {
    "maps.app.goo.gl", "goo.gl", "g.page", "g.co"
}

def _build_gmaps_by_place_id(name: Optional[str], place_id: str) -> str:
    # 同時帶 query 與 query_place_id，Google 會顯示正式商家頁
    q = quote_plus(name) if name else ""
    base = "https://www.google.com/maps/search/?api=1"
    if q:
        return f"{base}&query={q}&query_place_id={quote_plus(place_id)}"
    return f"{base}&query_place_id={quote_plus(place_id)}"

def _build_gmaps_by_latlng(lat: float, lng: float) -> str:
    # 最穩定：座標搜尋
    return f"https://www.google.com/maps/search/?api=1&query={lat:.7f}%2C{lng:.7f}"

def _build_gmaps_by_name(name: str) -> str:
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus(name)}"

def build_gmaps_url(name: Optional[str] = None,
                    lat: Optional[float] = None,
                    lng: Optional[float] = None,
                    place_id: Optional[str] = None) -> str:
    """依可用資訊產生『正式可用』的 Google Maps 連結。"""
    if place_id:
        return _build_gmaps_by_place_id(name, place_id)
    if lat is not None and lng is not None:
        return _build_gmaps_by_latlng(lat, lng)
    if name:
        return _build_gmaps_by_name(name)
    # 實在沒資料就給 Maps 首頁，至少不會炸
    return "https://www.google.com/maps"

def normalize_existing_gmaps(orig_url: Optional[str],
                             name: Optional[str],
                             lat: Optional[float],
                             lng: Optional[float],
                             place_id: Optional[str]) -> str:
    """
    把舊連結（包含 maps.app.goo.gl 短鏈或各種奇形怪狀）正規化成 google.com/maps 的『可開』連結。
    優先順序：place_id > lat,lng > 名稱 > 從舊連結挖出 q= 的關鍵字。
    """
    # 統一 fallback 策略
    def _fallback_from_meta() -> str:
        return build_gmaps_url(name=name, lat=lat, lng=lng, place_id=place_id)

    url = (orig_url or "").strip()
    if not url:
        return _fallback_from_meta()

    try:
        u = urlparse(url)
        host = (u.netloc or "").lower()
        path = u.path or ""
        qs = parse_qs(u.query or "")
    except Exception:
        return _fallback_from_meta()

    # 如果是已經是 google.com/maps 的正式連結，直接用（避免重寫）
    if host in GOOGLE_MAPS_HOSTS and path.startswith("/maps"):
        return url

    # 若是短鏈或動態鏈（maps.app.goo.gl 等），不嘗試線上展開（LINE 環境常被擋），改為抽出 q 或直接 fallback
    if host in SHORTENER_HOSTS:
        # 常見：maps.app.goo.gl/?q=<keyword> → 抽 q
        q = (qs.get("q") or [""])[0].strip()
        if q:
            return _build_gmaps_by_name(q)
        return _fallback_from_meta()

    # 其他奇怪網域（FB 分享、部落格轉跳等），試著從參數抓 q，否則用 meta
    q = (qs.get("q") or [""])[0].strip()
    if q:
        return _build_gmaps_by_name(q)

    return _fallback_from_meta()
