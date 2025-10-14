from fastapi import APIRouter, Query
from services.places import get_categories_by_district, filter_places

router = APIRouter()

@router.get("/places/categories")
async def categories(city: str = Query(...), district: str = Query(...)):
    return {"city": city, "district": district, "categories": get_categories_by_district(city, district)}

@router.get("/places")
async def places(city: str = Query(...), district: str = Query(...),
                 category: str | None = None, page:int=1, page_size:int=6):
    return filter_places(city, district, category, page, page_size)