# app/config/settings.py（重點是把 alias= 換成 env=）
from __future__ import annotations
from functools import lru_cache
from pathlib import Path
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, Iterable, List, Dict, Any
import json
from pydantic import Field
from dotenv import load_dotenv
import os

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"
load_dotenv(ENV_FILE)  # 後援

class Settings(BaseSettings):

    # --- LINE credentials / server ---
    channel_secret: Optional[str] = Field(default=None, env="channel_secret")
    channel_access_token: Optional[str] = Field(default=None, env="channel_access_token")

    port: int = Field(default=8000, env="port")
    env: str = Field(default="dev", env="env")

    # 舊名：skip_signature_verify；程式碼中用 should_skip_verify
    skip_signature_verify: Optional[bool] = Field(default=None, env="skip_signature_verify")
    should_skip_verify: bool = False  # 實際使用這個

    city_default: Optional[str] = Field(default=None, env="city_default")

    # --- 資料與靜態資源 ---
    asset_base_url: str = Field(default="", env="ASSET_BASE_URL")
    # ✅ 新：資料目錄，預設 app/data
    places_dir: Path = Field(default=PROJECT_ROOT / "app" / "data", env="PLACES_DIR")
    # ✅ 舊：單一檔案（相容用；若設了就用它）
    places_path: Optional[Path] = Field(default=None, env="PLACES_PATH")

    assets_bucket: str | None = os.getenv("ASSETS_BUCKET")  # 你的 GCS bucket 名稱
    assets_prefix: str = os.getenv("ASSETS_PREFIX", "imagemeps")  # 存放目錄前綴（可用預設）
    
    # ---- 路徑工具 ----
    @property
    def taipei_path(self) -> Path:
        # 若 places_path 是檔案，就回傳它（舊用法）；否則用 places_dir/taipei.json
        if self.places_path and self.places_path.is_file():
            return self.places_path
        return self.places_dir / "taipei.json"
    
    @property
    def newtaipei_path(self) -> Path:
        if self.places_path and self.places_path.is_file():
            return self.places_path
        return self.places_dir / "newtaipei.json"

    @property
    def taichung_path(self) -> Path:
        if self.places_path and self.places_path.is_file():
            # 單檔模式下沒有台中獨立檔，就回單檔（讓呼叫端不炸）
            return self.places_path
        return self.places_dir / "taichung.json"

    @property
    def kaohsiung_path(self) -> Path:
        if self.places_path and self.places_path.is_file():
            return self.places_path
        return self.places_dir / "kaohsiung.json"

    def get_city_data_path(self, city: str) -> Optional[Path]:
        """
        取得城市對應的檔案路徑。
        - 若設定了舊的 PLACES_PATH（單檔），就回傳該檔。
        - 否則依城市回 places_dir 下的對應檔案。
        """
        if self.places_path and self.places_path.is_file():
            return self.places_path  # 單檔模式
        city_map = {
            "台北": "taipei.json",
            "新北": "newtaipei.json",
            "台中": "taichung.json",
            "高雄": "kaohsiung.json",
        }
        filename = city_map.get(city)
        return (self.places_dir / filename) if filename else None

    # ---- 載入工具：合併多檔 or 讀單檔 ----
    def iter_place_files(self) -> Iterable[Path]:
        """
        依設定產生應讀取的檔案清單：
        - 若 places_path 是有效檔案 → 只讀它（舊法）
        - 否則讀 places_dir 下的 taipei/taichung/kaohsiung.json（存在才讀）
        """
        if self.places_path and self.places_path.is_file():
            yield self.places_path
            return
        # 掃描json檔
        for p in [self.taipei_path, self.taichung_path, self.kaohsiung_path,self.newtaipei_path]:
            if p.is_file():
                yield p

    def load_places(self) -> List[Dict[str, Any]]:
        """
        將 iter_place_files() 依序讀入並合併成一個 list。
        """
        data: List[Dict[str, Any]] = []
        for fp in self.iter_place_files():
            try:
                with fp.open("r", encoding="utf-8") as f:
                    chunk = json.load(f)
                if isinstance(chunk, list):
                    data.extend(chunk)
            except Exception as e:
                # 這裡你有 logging 的話可記錄
                pass
        return data

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache
def get_settings() -> Settings:
    s = Settings()
    print(
        f"[SETTINGS] env_file={ENV_FILE} exists={ENV_FILE.exists()} "
        f"cwd={Path.cwd()} env={s.env} skip_verify={s.should_skip_verify} "
        f"secret_set={bool(s.channel_secret)} token_set={bool(s.channel_access_token)} "
        f"places_path={s.places_path}"
    )
    return s

settings = get_settings()
