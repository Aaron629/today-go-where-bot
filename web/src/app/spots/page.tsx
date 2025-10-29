"use client";
import { useMemo, useState } from "react";

/** 小工具：把多段 class 合併成單行，避免出現換行字元 */
const cn = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

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
  { name: "大稻埕碼頭", type: "walk", city: "台北", district: "大同區", description: "夕陽與貨櫃市集知名，適合散步與拍照。", tags: ["散步","夕陽","市集"], hours: "依場館或店家為準", cost: "依消費或免費", gmaps: "https://maps.app.goo.gl/?q=大稻埕碼頭", image_url: "https://picsum.photos/seed/dadaocheng/800/500" },
  { name: "華山1914文創園區", type: "spot", city: "台北", district: "中正區", description: "藝文展覽與市集活動密集的老酒廠園區。", tags: ["展覽","市集","打卡"], gmaps: "https://maps.app.goo.gl/?q=華山1914", image_url: "https://picsum.photos/seed/huashan/800/500" },
  { name: "永康街美食", type: "food", city: "台北", district: "大安區", description: "小吃與異國餐廳聚集，適合邊走邊吃。", tags: ["美食","小吃","異國料理"], gmaps: "https://maps.app.goo.gl/?q=永康街", image_url: "https://picsum.photos/seed/yongkang/800/500" },
  { name: "象山步道", type: "view", city: "台北", district: "信義區", description: "熱門夜景拍照點，可眺望台北101。", tags: ["夜景","登山","攝影"], hours: "24h", cost: "免費", gmaps: "https://maps.app.goo.gl/?q=象山步道", image_url: "https://picsum.photos/seed/xiangshan/800/500" },
  { name: "松菸誠品與文創園區", type: "spot", city: "台北", district: "信義區", description: "設計選品與展演空間並存的文化據點。", tags: ["展演","書店","咖啡"], gmaps: "https://maps.app.goo.gl/?q=松山文創園區", image_url: "https://picsum.photos/seed/songshan/800/500" },
  { name: "新北耶誕城", type: "spot", city: "新北", district: "板橋區", description: "冬季限定燈飾活動，人潮熱鬧適合拍照。", tags: ["季節限定","拍照","夜晚"], gmaps: "https://maps.app.goo.gl/?q=新北耶誕城", image_url: "https://picsum.photos/seed/banqiao/800/500" },
  { name: "淡水漁人碼頭", type: "view", city: "新北", district: "淡水區", description: "情人橋夕陽景色，約會散步首選。", tags: ["海景","日落","散步"], gmaps: "https://maps.app.goo.gl/?q=淡水漁人碼頭", image_url: "https://picsum.photos/seed/fisherman/800/500" },
  { name: "九份老街", type: "walk", city: "新北", district: "瑞芳區", description: "山城巷弄與茶館，夜景別具風味。", tags: ["山城","茶館","老街"], gmaps: "https://maps.app.goo.gl/?q=九份老街", image_url: "https://picsum.photos/seed/jiufen/800/500" },
  { name: "審計新村", type: "walk", city: "台中", district: "西區", description: "文青市集與老宅咖啡聚落。", tags: ["市集","咖啡","文青"], gmaps: "https://maps.app.goo.gl/?q=審計新村", image_url: "https://picsum.photos/seed/shenji/800/500" },
  { name: "草悟道", type: "park", city: "台中", district: "西區", description: "綠廊道步行區，周邊藝文空間豐富。", tags: ["散步","藝文","親子"], gmaps: "https://maps.app.goo.gl/?q=草悟道", image_url: "https://picsum.photos/seed/caowudao/800/500" },
  { name: "高雄駁二特區", type: "spot", city: "高雄", district: "鹽埕區", description: "港邊倉庫改造，展演市集與裝置藝術。", tags: ["展演","海港","打卡"], gmaps: "https://maps.app.goo.gl/?q=駁二", image_url: "https://picsum.photos/seed/piers2/800/500" },
  { name: "高雄美麗島光之穹頂", type: "view", city: "高雄", district: "新興區", description: "地鐵站公共藝術地標，夜間更迷人。", tags: ["公共藝術","夜景","拍照"], gmaps: "https://maps.app.goo.gl/?q=美麗島站", image_url: "https://picsum.photos/seed/dome/800/500" },
  { name: "士林夜市", type: "food", city: "台北", district: "士林區", description: "台北代表性夜市，聚集小吃美食。", tags: ["夜市","小吃","美食"], gmaps: "https://maps.app.goo.gl/?q=士林夜市", image_url: "https://picsum.photos/seed/shihlin/800/500" },
  { name: "華江雁鴨自然公園", type: "park", city: "新北", district: "板橋區", description: "賞鳥步道與河濱騎行路線。", tags: ["親子","賞鳥","騎車"], gmaps: "https://maps.app.goo.gl/?q=華江雁鴨自然公園", image_url: "https://picsum.photos/seed/huawei/800/500" },
  { name: "彩虹橋", type: "view", city: "台北", district: "內湖區", description: "夜晚橋拱燈光倒映河面，適合散步拍照。", tags: ["夜景","河濱","散步"], gmaps: "https://maps.app.goo.gl/?q=彩虹橋 內湖", image_url: "https://picsum.photos/seed/rainbow/800/500" },
  { name: "信義商圈百貨", type: "mall", city: "台北", district: "信義區", description: "百貨林立，餐飲與逛街一次滿足。", tags: ["逛街","餐廳","約會"], gmaps: "https://maps.app.goo.gl/?q=信義商圈", image_url: "https://picsum.photos/seed/xinyi/800/500" },
];

const TYPES: Spot["type"][] = ["spot", "walk", "food", "mall", "park", "view"];
const CITIES = ["台北", "新北", "台中", "高雄"];

export default function SpotsPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [t, setT] = useState<Spot["type"] | "">("");
  const [picked, setPicked] = useState<Spot | null>(null);

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

  const randomPick = () => {
    if (filtered.length === 0) return setPicked(null);
    const idx = Math.floor(Math.random() * filtered.length);
    setPicked(filtered[idx]);
  };

  return (
    <section className={cn("mx-auto max-w-6xl px-4 py-8")}>
      <div className={cn("prose max-w-none")}>
        <h1>景點探索 & 抽選</h1>
        <p>輸入關鍵字或條件篩選，按一下「抽一個」幫你決定今天去哪兒。</p>
      </div>

      {/* Controls */}
      <div className={cn("mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4")}>
        <div>
          <label className={cn("block text-sm font-medium mb-1")} htmlFor="kw">關鍵字</label>
          <input
            id="kw"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="輸入景點、標籤、描述關鍵字…"
            className={cn(
              "w-full rounded-xl border px-3 py-2 outline-none",
              "bg-white/90 dark:bg-white/5",
              "border-slate-300 dark:border-white/15",
              "text-slate-900 dark:text-slate-100",
              "placeholder-slate-400 dark:placeholder-white/40",
              "focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20"
            )}
          />
        </div>

        {/* 城市 */}
        <div>
          <label className={cn("block text-sm font-medium mb-1")} htmlFor="city">城市</label>
          <div className={cn("relative")}>
            <select
              id="city"
              value={city}
              onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
              className={cn(
                "w-full appearance-none rounded-xl px-3 py-2 pr-9",
                "border border-slate-300 text-slate-900 bg-white/90",
                "focus:outline-none focus:ring-2 focus:ring-slate-300",
                "dark:border-white/15 dark:text-slate-100 dark:bg-slate-800",
                "dark:focus:ring-white/20"
              )}
            >
              <option value="" className="bg-white dark:bg-slate-800">全部</option>
              {CITIES.map((c) => (
                <option key={c} value={c} className="bg-white dark:bg-slate-800">{c}</option>
              ))}
            </select>
            <span className={cn("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60")}>
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" className={cn("text-slate-500 dark:text-slate-300")}>
                <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>

        {/* 行政區 */}
        <div>
          <label className={cn("block text-sm font-medium mb-1")} htmlFor="dist">行政區</label>
          <input
            id="dist"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="例如：大安區、信義區…"
            className={cn(
              "w-full rounded-xl border px-3 py-2",
              "bg-white/90 dark:bg-white/5",
              "border-slate-300 dark:border-white/15",
              "text-slate-900 dark:text-slate-100",
              "focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20"
            )}
          />
        </div>

        {/* 類型 */}
        <div>
          <label className={cn("block text-sm font-medium mb-1")} htmlFor="type">類型</label>
          <div className={cn("relative")}>
            <select
              id="type"
              value={t}
              onChange={(e) => setT(e.target.value as Spot["type"] | "")}
              className={cn(
                "w-full appearance-none rounded-xl px-3 py-2 pr-9",
                "border border-slate-300 text-slate-900 bg-white/90",
                "focus:outline-none focus:ring-2 focus:ring-slate-300",
                "dark:border-white/15 dark:text-slate-100 dark:bg-slate-800",
                "dark:focus:ring-white/20"
              )}
            >
              <option value="" className="bg-white dark:bg-slate-800">全部</option>
              {TYPES.map((tt) => (
                <option key={tt} value={tt} className="bg-white dark:bg-slate-800">{tt}</option>
              ))}
            </select>
            <span className={cn("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60")}>
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" className={cn("text-slate-500 dark:text-slate-300")}>
                <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={cn("mt-4 flex items-center gap-3")}>
        <button
          onClick={randomPick}
          className={cn(
            "rounded-xl px-4 py-2 border transition active:scale-[.98]",
            "bg-slate-900 text-white hover:bg-slate-800",
            "dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          )}
        >
          🎲 抽一個
        </button>
        <button
          onClick={() => { setQ(""); setCity(""); setDistrict(""); setT(""); setPicked(null); }}
          className={cn(
            "rounded-xl px-4 py-2 border transition",
            "bg-white/90 text-slate-900 hover:bg-white",
            "dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
            "border-slate-300 dark:border-white/15"
          )}
        >
          重新設定
        </button>
        <div className={cn("text-sm text-slate-700 dark:text-slate-200")}>
          符合條件：<span className="font-semibold">{filtered.length}</span> 筆
        </div>
      </div>

      {/* Picked card */}
      {picked && (
        <div className={cn(
          "mt-6 rounded-2xl border p-4",
          "bg-white/90 dark:bg-white/5",
          "border-slate-300 dark:border-white/15"
        )}>
          <div className={cn("text-sm mb-2 text-slate-700 dark:text-slate-200")}>抽選結果</div>
          <div className={cn("flex flex-col md:flex-row gap-4")}>
            {picked.image_url && (
              <img
                src={picked.image_url}
                alt={picked.name}
                className={cn("w-full md:w-72 h-44 object-cover rounded-xl border border-slate-300 dark:border-white/15")}
              />
            )}
            <div className={cn("flex-1")}>
              <h3 className={cn("text-xl font-semibold text-slate-900 dark:text-white")}>{picked.name}</h3>
              <div className={cn("mt-1 text-sm text-slate-600 dark:text-slate-300")}>
                {picked.city} · {picked.district} · <span className="uppercase">{picked.type}</span>
              </div>
              <p className={cn("mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200")}>{picked.description}</p>
              <div className={cn("mt-2 flex flex-wrap gap-2")}>
                {picked.tags.map((tg) => (
                  <span key={tg} className={cn(
                    "text-xs rounded-full px-2 py-1",
                    "bg-white/80 text-slate-900 border border-slate-300",
                    "dark:bg-white/10 dark:text-white dark:border-white/15"
                  )}>#{tg}</span>
                ))}
              </div>
              <div className={cn("mt-3 flex items-center gap-3 text-sm")}>
                {picked.gmaps && (
                  <a className={cn("inline-flex items-center gap-1 underline text-slate-900 dark:text-white")} href={picked.gmaps} target="_blank" rel="noreferrer">
                    🗺️ 在 Google Maps 開啟
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results grid */}
      <div className={cn("mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3")}>
        {filtered.map((s) => (
          <article
            key={`${s.name}-${s.district}`}
            className={cn(
              "rounded-2xl overflow-hidden border shadow-sm hover:shadow transition",
              "bg-white/90 dark:bg-white/5",
              "border-slate-300 dark:border-white/15"
            )}
          >
            {s.image_url && (
              <img src={s.image_url} alt={s.name} className={cn("w-full h-40 object-cover")} />
            )}
            <div className={cn("p-4")}>
              <h3 className={cn("font-semibold text-lg text-slate-900 dark:text-white")}>{s.name}</h3>
              <div className={cn("text-sm mt-1 text-slate-600 dark:text-slate-300")}>
                {s.city} · {s.district} · <span className="uppercase">{s.type}</span>
              </div>
              <p className={cn("mt-2 text-sm line-clamp-2 text-slate-700 dark:text-slate-200")}>{s.description}</p>

              <div className={cn("mt-3 flex flex-wrap gap-2")}>
                {s.tags.slice(0, 4).map((tg) => (
                  <span key={tg} className={cn(
                    "text-xs rounded-full px-2 py-1",
                    "bg-white/80 text-slate-900 border border-slate-300",
                    "dark:bg-white/10 dark:text-white dark:border-white/15"
                  )}>#{tg}</span>
                ))}
              </div>

              <div className={cn("mt-3 flex items-center gap-3 text-sm")}>
                {s.gmaps && (
                  <a className={cn("inline-flex items-center gap-1 underline text-slate-900 dark:text-white")} href={s.gmaps} target="_blank" rel="noreferrer">
                    🗺️ 地圖
                  </a>
                )}
                <button
                  className={cn(
                    "ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs",
                    "border border-slate-300 bg-white/80 text-slate-900 hover:bg-white",
                    "dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  )}
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

      {filtered.length === 0 && (
        <div className={cn(
          "mt-10 rounded-2xl border p-10 text-center",
          "bg-white/90 dark:bg-white/5",
          "border-slate-300 dark:border-white/15",
          "text-slate-700 dark:text-slate-200"
        )}>
          沒找到符合條件的景點，試試換個關鍵字或清空篩選。
        </div>
      )}
    </section>
  );
}
