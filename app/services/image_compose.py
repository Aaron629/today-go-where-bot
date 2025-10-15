# app/services/image_compose.py
from pathlib import Path
from PIL import Image
from fastapi import HTTPException
from fastapi.responses import FileResponse
import os, time

GRID_W, GRID_H = 1040, 1040
CELL_W, CELL_H = 520, 346
COORDS = [(0,0), (520,0), (0,346), (520,346), (0,692), (520,692)]

STATIC_IMAGEMAP_DIR = Path("app/static/imagemeps")
SRC_1040 = STATIC_IMAGEMAP_DIR / "categories_1040_grid.png"
ALLOWED_SIZES = {1040, 700, 460}


def make_category_grid_image(output_path: str, base_path: str, categories: list[str]) -> str:
    """
    將六張類別圖合成到 1040x1040 的網格圖。
    回傳輸出的實際路徑字串。
    """
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    grid = Image.new("RGB", (GRID_W, GRID_H), (255, 255, 255))  # 白底
    for (x, y), fname in zip(COORDS, categories):
        img = Image.open(Path(base_path) / fname).resize((CELL_W, CELL_H))
        grid.paste(img, (x, y))

    grid.save(out)
    return str(out)


def build_if_needed(output_path: str, base_path: str, categories: list[str]) -> str:
    """
    若 output 不存在或任一來源較新，就重建。
    """
    out = Path(output_path)
    src_mtime = max((Path(base_path)/f).stat().st_mtime for f in categories)
    need_build = (not out.exists()) or (out.stat().st_mtime < src_mtime)
    if need_build:
        return make_category_grid_image(output_path, base_path, categories)
    return str(out)

def ensure_resized(size: int) -> Path:
    if size not in ALLOWED_SIZES:
        raise HTTPException(status_code=404, detail="size not supported")

    target = STATIC_IMAGEMAP_DIR / f"categories_{size}.png"  # ← 確保是 .png

    if target.is_file():
        return target

    if not SRC_1040.is_file():
        raise HTTPException(status_code=404, detail="source image (1040) missing")

    with Image.open(SRC_1040) as im:
        w, h = im.size
        if w != 1040:
            im = im.resize((1040, int(h * 1040 / w)), Image.LANCZOS)
        new_h = int(im.height * (size / 1040))
        resized = im.resize((size, new_h), Image.LANCZOS)
        target.parent.mkdir(parents=True, exist_ok=True)
        resized.save(target, format="PNG", optimize=True)  # ← 改成 PNG

    return target

def imagemap_categories(size: int):
    try:
        img_path = ensure_resized(size)
    except HTTPException:
        raise
    except Exception as e:
        # 有任何未預期錯誤，避免 500 卡住，回 404 比較安全
        raise HTTPException(status_code=404, detail=f"image build failed: {e}")

    return FileResponse(img_path, media_type="image/png")