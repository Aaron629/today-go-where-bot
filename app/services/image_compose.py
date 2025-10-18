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

# 下面是新的確保縮圖：從 base_dir 讀 grid，輸出到 base_dir
def ensure_resized(size: int, base_dir: str = "/tmp/imagemeps") -> str:
    """
    確保存在 {base_dir}/categories_{size}.png，若無就從 {base_dir}/categories_1040_grid.png 重產
    回傳檔案路徑
    """
    base = Path(base_dir)
    base.mkdir(parents=True, exist_ok=True)
    out_path = base / f"categories_{size}.png"
    if out_path.exists():
        return str(out_path)

    src = base / "categories_1040_grid.png"
    if not src.exists():
        raise FileNotFoundError(f"Missing {src}")

    im = Image.open(src)
    if size != im.width:
        ratio = size / im.width
        new_h = int(round(im.height * ratio))
        im = im.resize((size, new_h), Image.LANCZOS)
    if im.mode != "RGB":
        im = im.convert("RGB")
    im.save(out_path, format="PNG")
    return str(out_path)


def imagemap_categories(size: int):
    try:
        img_path = ensure_resized(size)
    except HTTPException:
        raise
    except Exception as e:
        # 有任何未預期錯誤，避免 500 卡住，回 404 比較安全
        raise HTTPException(status_code=404, detail=f"image build failed: {e}")

    return FileResponse(img_path, media_type="image/png")