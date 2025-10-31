// /pages/food.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import Image from "next/image";

type FoodSpot = {
  name: string;
  type: "restaurant" | "cafe" | "snack";
  city: string;
  district: string;
  description: string;
  tags: string[];
  hours?: string;
  cost?: string;
  geo?: { lat: number | null; lng: number | null };
  gmaps?: string;
  image_url?: string;
};

const TYPE_LABEL: Record<FoodSpot["type"], string> = {
  restaurant: "餐館",
  cafe: "咖啡",
  snack: "小吃",
};

// 建議把這三張放到 public/img/ 下
const PLACEHOLDER: Record<FoodSpot["type"], string> = {
  restaurant: "/img/ph-restaurants.jpg",
  cafe: "/img/ph-coffee.jpg",
  snack: "/img/ph-snack.jpg",
};

// 統一取得要顯示的圖片
const getDisplayImage = (s: FoodSpot) =>
  (s.image_url && s.image_url.trim()) ? s.image_url.trim() : PLACEHOLDER[s.type];

/** ---------- Utilities ---------- */
// 把任意來源的 gmaps 正規化成穩定可用的格式
function normalizeGmaps(s: FoodSpot): string | undefined {
  const hasCoord = s.geo && s.geo.lat != null && s.geo.lng != null;
  if (hasCoord) {
    return `https://www.google.com/maps/search/?api=1&query=${s.geo!.lat},${s.geo!.lng}`;
  }
  // 沒座標就用店名；會自動把空白、# 等字元編碼掉
  const q = encodeURIComponent(s.name?.trim() ?? "");
  if (!q) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// 在 LIFF 內以外部視窗開啟；一般網頁則直接新分頁
function openMap(url: string) {
  const anyWin = window as any;
  const liff = anyWin?.liff;

  if (liff?.isInClient?.()) {
    liff.openWindow({ url, external: true });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function FoodPage() {
  const [all, setAll] = useState<FoodSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState<FoodSpot["type"] | "all">("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/data/food_spots.json", { cache: "no-store" });
        const data: FoodSpot[] = await res.json();

        // ★ 讀進來就正規化 gmaps（也可以在這裡清理 image_url 空字串）
        const fixed = data.map((s) => ({
          ...s,
          gmaps: normalizeGmaps(s),
          image_url: s.image_url?.trim() ? s.image_url : undefined,
        }));

        setAll(fixed);

        // 預設城市為第一個
        const firstCity = Array.from(new Set(fixed.map((s) => s.city)))[0] ?? "";
        setCity(firstCity);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 可選城市/商圈
  const cities = useMemo(
    () => Array.from(new Set(all.map((s) => s.city))),
    [all]
  );
  const districts = useMemo(
    () =>
      Array.from(
        new Set(all.filter((s) => !city || s.city === city).map((s) => s.district))
      ),
    [all, city]
  );

  // 篩選
  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return all.filter((s) => {
      if (city && s.city !== city) return false;
      if (district && s.district !== district) return false;
      if (type !== "all" && s.type !== type) return false;

      if (kw) {
        const hay = [
          s.name,
          s.description,
          s.city,
          s.district,
          ...(s.tags || []),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [all, city, district, q, type]);

  return (
    <section className="space-y-8">
      {/* Header */}
      <header className="rounded-2xl p-8 bg-gradient-to-br from-rose-200/60 to-orange-100/40 backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.1)]">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">商圈美食</h1>
        <p className="mt-2 text-black/70">
          選城市與商圈，或用關鍵字搜尋（店名、標籤）。類型可切換「餐館/咖啡/小吃」。
        </p>

        {/* 控制列（深色版） */}
        <div className="mt-6 flex flex-wrap gap-3">
          {/* 城市 */}
          <select
            className="px-3 py-2 rounded-lg border transition
                    bg-white/10 text-white border-white/20
                    hover:bg-white/15 appearance-none
                    focus:outline-none focus:ring-2 focus:ring-white/30"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setDistrict("");
            }}
          >
            {cities.map((c) => (
              <option key={c} value={c} className="bg-neutral-900 text-white">
                {c}
              </option>
            ))}
          </select>

          {/* 商圈 */}
          <select
            className="px-3 py-2 rounded-lg border transition
                    bg-white/10 text-white border-white/20
                    hover:bg-white/15 appearance-none
                    focus:outline-none focus:ring-2 focus:ring-white/30"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="" className="bg-neutral-900 text-white">
              全部商圈
            </option>
            {districts.map((d) => (
              <option key={d} value={d} className="bg-neutral-900 text-white">
                {d}
              </option>
            ))}
          </select>

          {/* 搜尋 */}
          <input
            placeholder="搜尋店名 / 標籤 / 敘述"
            className="px-3 py-2 rounded-lg border transition min-w-[240px]
                    bg-white/10 text-white placeholder-white/60 border-white/20
                    hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="flex gap-2">
            {(["all", "restaurant", "cafe", "snack"] as const).map((t) => {
              const active = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t as any)}
                  className={[
                    "px-3 py-2 rounded-lg border transition",
                    "focus:outline-none focus:ring-2 focus:ring-white/40",
                    active
                      ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20",
                  ].join(" ")}
                >
                  {t === "all" ? "全部" : TYPE_LABEL[t as FoodSpot["type"]]}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 狀態 */}
      {loading && <p className="text-black/60">載入中…</p>}

      {/* 清單 */}
      {!loading && (
        <>
          {filtered.length === 0 ? (
            <p className="text-black/60">目前此條件沒有資料。</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((s, i) => (
                <article
                  key={`${s.name}-${i}`}
                  className="rounded-xl border p-5 hover:bg-white/5 hover:border-white/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                    <span className="text-xs rounded-full border px-2 py-0.5">
                      {TYPE_LABEL[s.type]}
                    </span>
                  </div>

                  <p className="text-sm text-black/60 mt-1">
                    {s.city} · {s.district}
                  </p>

                  {/* 圖片（若有，若無則顯示示意圖） */}
                  <figure className="mt-3 overflow-hidden rounded-lg border">
                    <div className="relative w-full h-40 md:h-48">
                      <Image
                        src={getDisplayImage(s)!}
                        alt={s.name}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={i < 2}
                        placeholder="blur"
                        blurDataURL="/img/blur-16x9.png"
                      />
                    </div>
                  </figure>

                  <p className="text-sm mt-2">{s.description}</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {s.tags?.map((t) => (
                      <span
                        key={t}
                        className="text-xs rounded-full bg-black/5 px-2 py-0.5"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* 地區行 */}
                  <p className="text-sm text-white/60 mt-1">
                    {s.city} · {s.district}
                  </p>

                  {/* 分隔線（可選） */}
                  <div className="my-3 h-px bg-white/10" />

                  {/* 營業/消費區塊 */}
                  <div className="text-xs text-white/60 mt-3 space-y-1">
                    {s.hours && <div>營業：{s.hours}</div>}
                    {s.cost && <div>消費：{s.cost}</div>}
                  </div>

                  <div className="mt-3 flex gap-2">
                    {s.gmaps ? (
                      <button
                        onClick={() => openMap(s.gmaps!)}
                        title="在地圖開啟"
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm
                                  border-emerald-300/70 text-emerald-800 bg-emerald-50/10
                                  hover:bg-emerald-100/20 hover:shadow-[0_0_6px_rgba(16,185,129,0.4)]
                                  transition"
                        aria-label={`在地圖開啟：${s.name}`}
                      >
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        <span>地圖</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm
                                  border-black/10 text-black/40 cursor-not-allowed"
                        aria-disabled
                      >
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        無地圖
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
