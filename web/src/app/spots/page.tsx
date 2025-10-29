"use client";
import { useMemo, useState } from "react";

// --- Demo types & mock data (依你的既定資料格式) ---
export type Spot = {
  name: string;
  type: "spot" | "walk" | "food" | "mall" | "park" | "view";
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

const MOCK_SPOTS: Spot[] = [
  {
    name: "大稻埕碼頭",
    type: "walk",
    city: "台北",
    district: "大同區",
    description: "夕陽與貨櫃市集知名，適合散步與拍照。",
    tags: ["散步", "夕陽", "市集"],
    hours: "依場館或店家為準",
    cost: "依消費或免費",
    gmaps: "https://maps.app.goo.gl/?q=大稻埕碼頭",
    image_url: "https://picsum.photos/seed/dadaocheng/800/500",
  },
  {
    name: "華山1914文創園區",
    type: "spot",
    city: "台北",
    district: "中正區",
    description: "藝文展覽與市集活動密集的老酒廠園區。",
    tags: ["展覽", "市集", "打卡"],
    hours: "依場館或店家為準",
    cost: "依消費或免費",
    gmaps: "https://maps.app.goo.gl/?q=華山1914",
    image_url: "https://picsum.photos/seed/huashan/800/500",
  },
  {
    name: "永康街美食",
    type: "food",
    city: "台北",
    district: "大安區",
    description: "小吃與異國餐廳聚集，適合邊走邊吃。",
    tags: ["美食", "小吃", "異國料理"],
    hours: "依店家為準",
    cost: "依消費",
    gmaps: "https://maps.app.goo.gl/?q=永康街",
    image_url: "https://picsum.photos/seed/yongkang/800/500",
  },
  {
    name: "象山步道",
    type: "view",
    city: "台北",
    district: "信義區",
    description: "熱門夜景拍照點，可眺望台北101。",
    tags: ["夜景", "登山", "攝影"],
    hours: "24h",
    cost: "免費",
    gmaps: "https://maps.app.goo.gl/?q=象山步道",
    image_url: "https://picsum.photos/seed/xiangshan/800/500",
  },
];

// --- Helpers ---
const TYPES: Spot["type"][] = ["spot", "walk", "food", "mall", "park", "view"];
const CITIES = ["台北", "新北", "台中", "高雄"];

export default function SpotsPage() {
  // UI state
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [t, setT] = useState<Spot["type"] | "">("");
  const [picked, setPicked] = useState<Spot | null>(null);

  // Derived list (filtering)
  const filtered = useMemo(() => {
    const keyword = q.trim();
    return MOCK_SPOTS.filter((s) => {
      if (city && s.city !== city) return false;
      if (district && s.district !== district) return false;
      if (t && s.type !== t) return false;
      if (!keyword) return true;
      const hay = `${s.name} ${s.description} ${s.tags.join(" ")}`;
      return hay.toLowerCase().includes(keyword.toLowerCase());
    });
  }, [q, city, district, t]);

  // Random pick from filtered list
  const randomPick = () => {
    if (filtered.length === 0) return setPicked(null);
    const idx = Math.floor(Math.random() * filtered.length);
    setPicked(filtered[idx]);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="prose max-w-none">
        <h1>景點探索 & 抽選</h1>
        <p>輸入關鍵字或條件篩選，按一下「抽一個」幫你決定今天去哪兒。</p>
      </div>

      {/* Controls */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="kw">關鍵字</label>
          <input
            id="kw"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="輸入景點、標籤、描述關鍵字…"
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="city">城市</label>
          <select
            id="city"
            value={city}
            onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="">全部</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="dist">行政區</label>
          <input
            id="dist"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="例如：大安區、信義區…"
            className="w-full rounded-xl border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="type">類型</label>
          <select
            id="type"
            value={t}
            onChange={(e) => setT(e.target.value as Spot["type"] | "")}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="">全部</option>
            {TYPES.map((tt) => (
              <option key={tt} value={tt}>{tt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={randomPick}
          className="rounded-xl border px-4 py-2 hover:shadow active:scale-[.98]"
        >
          🎲 抽一個
        </button>
        <button
          onClick={() => { setQ(""); setCity(""); setDistrict(""); setT(""); setPicked(null); }}
          className="rounded-xl border px-4 py-2 hover:shadow"
        >
          重新設定
        </button>
        <div className="text-sm text-slate-600">符合條件：<span className="font-semibold">{filtered.length}</span> 筆</div>
      </div>

      {/* Picked card */}
      {picked && (
        <div className="mt-6 rounded-2xl border p-4 bg-white/60">
          <div className="text-sm mb-2">抽選結果</div>
          <div className="flex flex-col md:flex-row gap-4">
            <img
              src={picked.image_url}
              alt={picked.name}
              className="w-full md:w-72 h-44 object-cover rounded-xl border"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{picked.name}</h3>
              <div className="mt-1 text-slate-600 text-sm">
                {picked.city} · {picked.district} · <span className="uppercase">{picked.type}</span>
              </div>
              <p className="mt-2 text-slate-700 text-sm leading-6">{picked.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {picked.tags.map((tg) => (
                  <span key={tg} className="text-xs rounded-full border px-2 py-1 bg-white">#{tg}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm">
                {picked.gmaps && (
                  <a className="inline-flex items-center gap-1 underline" href={picked.gmaps} target="_blank" rel="noreferrer">
                    🗺️ 在 Google Maps 開啟
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <article key={`${s.name}-${s.district}`} className="rounded-2xl border overflow-hidden bg-white">
            {s.image_url && (
              <img src={s.image_url} alt={s.name} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg">{s.name}</h3>
              <div className="text-sm text-slate-600 mt-1">
                {s.city} · {s.district} · <span className="uppercase">{s.type}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700 line-clamp-2">{s.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.tags.slice(0, 4).map((tg) => (
                  <span key={tg} className="text-xs rounded-full border px-2 py-1 bg-white">#{tg}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm">
                {s.gmaps && (
                  <a className="inline-flex items-center gap-1 underline" href={s.gmaps} target="_blank" rel="noreferrer">
                    🗺️ 地圖
                  </a>
                )}
                <button
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:shadow"
                  onClick={() => setPicked(s)}
                  aria-label={`抽選 ${s.name}`}
                >
                  🎯 想去
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border p-10 text-center text-slate-600">
          沒找到符合條件的景點，試試換個關鍵字或清空篩選。
        </div>
      )}

      {/* Dev notes / 接 API 指南 */}
      <div className="mt-10 rounded-2xl border p-4 bg-white/50">
        <h4 className="font-semibold">開發備註</h4>
        <ol className="list-decimal list-inside text-sm text-slate-700 mt-2 space-y-1">
          <li>
            將 <code>MOCK_SPOTS</code> 改為呼叫你的 GraphQL/REST：
            <pre className="text-xs bg-slate-50 border rounded p-2 mt-2 overflow-auto">
{`// 例：GraphQL（以 Strawberry 為例）
// query Spots($q: String, $city: String, $district: String, $type: String) {
//   spots(q: $q, city: $city, district: $district, type: $type) {
//     name type city district description tags hours cost gmaps image_url
//   }
// }
`}
            </pre>
          </li>
          <li>
            若要用 URL 參數保存篩選（可分享連結），可讀寫 <code>useSearchParams</code> / <code>useRouter</code>。
          </li>
          <li>
            實作「輪盤」時，可加入標籤/價格帶限制，或以權重（熱門度、開放時間）抽樣。
          </li>
        </ol>
      </div>
    </section>
  );
}
