// /pages/food.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

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
        const res = await fetch("/data/food_spots.json");
        const data: FoodSpot[] = await res.json();
        setAll(data);
        // 預設城市為第一個
        const firstCity = Array.from(new Set(data.map(s => s.city)))[0] ?? "";
        setCity(firstCity);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 依據目前 city 產生可選商圈
  const cities = useMemo(
    () => Array.from(new Set(all.map(s => s.city))),
    [all]
  );
  const districts = useMemo(
    () => Array.from(new Set(all.filter(s => !city || s.city === city).map(s => s.district))),
    [all, city]
  );

  // 篩選
  const filtered = useMemo(() => {
    const kw = q.trim();
    return all.filter(s => {
      if (city && s.city !== city) return false;
      if (district && s.district !== district) return false;
      if (type !== "all" && s.type !== type) return false;

      if (kw) {
        const hay = [s.name, s.description, s.city, s.district, ...(s.tags || [])]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(kw.toLowerCase())) return false;
      }
      return true;
    });
  }, [all, city, district, q, type]);

  return (
    <section className="space-y-8">
      {/* Header */}
      <header className="rounded-2xl p-8 bg-gradient-to-br from-rose-200/60 to-orange-100/40 border border-black/10">
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
            onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
        >
            {cities.map((c) => (
            <option key={c} value={c} className="bg-neutral-900 text-white">{c}</option>
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
            <option value="" className="bg-neutral-900 text-white">全部商圈</option>
            {districts.map((d) => (
            <option key={d} value={d} className="bg-neutral-900 text-white">{d}</option>
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
                        // 啟用：高對比底＋白字（可換成你的品牌色）
                        ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
                        // 未啟用：半透明底＋白字
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
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
                <article key={`${s.name}-${i}`} className="rounded-xl border p-5 hover:bg-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                    <span className="text-xs rounded-full border px-2 py-0.5">{TYPE_LABEL[s.type]}</span>
                  </div>

                  <p className="text-sm text-black/60 mt-1">
                    {s.city} · {s.district}
                  </p>

                  {/* 圖片（若有） */}
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.name}
                      className="mt-3 w-full h-40 object-cover rounded-lg border"
                      loading="lazy"
                    />
                  ) : null}

                  <p className="text-sm mt-2">{s.description}</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {s.tags?.map((t) => (
                      <span key={t} className="text-xs rounded-full bg-black/5 px-2 py-0.5">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-black/60 mt-3 space-y-1">
                    {s.hours && <div>營業：{s.hours}</div>}
                    {s.cost && <div>消費：{s.cost}</div>}
                  </div>

                  <div className="mt-3 flex gap-3">
                    {s.gmaps && (
                      <a
                        href={s.gmaps}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline"
                      >
                        查看地圖
                      </a>
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
