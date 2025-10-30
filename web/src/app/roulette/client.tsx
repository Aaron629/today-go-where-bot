"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useAnimation } from "framer-motion";

/** ---- 資料集 & 主題色 ---- */
const MENU = {
  breakfast: ["蛋餅", "飯糰", "吐司", "燒餅油條", "漢堡", "豆漿", "水煎包", "蘿蔔糕"],
  main: ["牛肉麵", "火鍋", "拉麵", "丼飯", "便當", "義大利麵", "韓式拌飯", "鐵板燒", "咖哩", "披薩"],
  drink: ["五十嵐", "鶴茶樓", "茶湯會", "清心福全", "珍煮丹", "錨起來喝", "麻古茶坊", "CoCo都可","迷客夏","一沐日","得正","鮮茶道","樂法","五桐號","八曜和茶"],
} as const;

const THEME = {
  breakfast: { bg: "from-amber-200/70 to-amber-100/40", textStrong: "text-amber-700", chip: "bg-amber-500 text-white" },
  main:      { bg: "from-teal-200/70 to-teal-100/40",   textStrong: "text-teal-700",   chip: "bg-teal-600 text-white" },
  drink:     { bg: "from-violet-200/70 to-violet-100/40", textStrong: "text-violet-700", chip: "bg-violet-600 text-white" },
} as const;

type Meal = keyof typeof MENU;

/** 幾何工具 */
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
}

export default function RouletteClient({ meal }: { meal: Meal }) {
  const items = MENU[meal];
  const theme = THEME[meal];

  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);
  const [angleBase, setAngleBase] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  /** ⭐ 首屏不要渲染動態內容，待掛載後再切換 */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pickByAngle = (deg: number) => {
    const norm = ((deg % 360) + 360) % 360;
    const slice = 360 / items.length;
    return Math.floor((360 - norm - 0.0001) / slice) % items.length;
  };

  const onSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);

    const extraTurns = 5 * 360;
    const slice = 360 / items.length;
    const targetOffset =
      Math.floor(Math.random() * items.length) * slice + Math.random() * (slice * 0.9);
    const target = angleBase + extraTurns + targetOffset;

    await controls.start({
      rotate: target,
      transition: { duration: 3.2, ease: [0.17, 0.67, 0.23, 0.99] },
    });

    const idx = pickByAngle(target);
    setWinner(items[idx]);
    setAngleBase(target);
    setSpinning(false);
  };

  /** 轉盤參數（常數不變，SSR/CSR 一致） */
  const size = 340;
  const cx = size / 2, cy = size / 2;
  const R = 150;
  const sliceAngle = 360 / items.length;

  const colors = useMemo(
    () => items.map((_, i) => (i % 2 ? "#fff8" : "#fff4")),
    [items]
  );

  return (
    <section className={`min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-10 bg-gradient-to-br ${theme.bg}`}>
      <h1 className="text-3xl md:text-4xl font-bold mb-2">🎯 今天吃什麼？</h1>
      <p className="text-black/70 mb-6">轉轉看，讓命運替你決定！</p>

      {/* 固定正方形容器，確保幾何中心一致 */}
      <div className="relative w-[340px] h-[340px]" suppressHydrationWarning>
        {/* 指針 */}
        <div className="absolute top-[12px] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-black/75 drop-shadow-md" aria-hidden="true"/>
        </div>

        {/* 🔒 首屏骨架（SSR/CSR 初次完全一致） */}
        {!mounted ? (
          <div
            className="absolute inset-0 rounded-full shadow-2xl border-[10px] border-white/90 bg-white/40 backdrop-blur"
            aria-hidden="true"
          />
        ) : (
          <>
            {/* ✅ 掛載後才渲染 Framer Motion 版本，鋪滿容器 */}
            <motion.svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${size} ${size}`}
              preserveAspectRatio="xMidYMid meet"
              initial={false}
              animate={controls}
              className="absolute inset-0 rounded-full shadow-2xl border-[10px] border-white/90 bg-white/40 backdrop-blur"
            >
              {/* 視覺中樞（讓中心更準） */}
              <circle cx={cx} cy={cy} r={R * 0.38} fill="rgba(0,0,0,.75)" />
              {items.map((label, i) => {
                const start = i * sliceAngle;
                const end = start + sliceAngle;
                const mid = start + sliceAngle / 2;

                const labelR = R * 0.62;
                const pos = polarToCartesian(cx, cy, labelR, mid);
                const rotate = mid + 90;

                return (
                  <g key={`${label}-${i}`}>
                    <path d={arcPath(cx, cy, R, start, end)} fill={colors[i]} stroke="rgba(0,0,0,.06)" />
                    <g transform={`translate(${pos.x}, ${pos.y}) rotate(${rotate})`}>
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fontSize={14}
                        fill="rgba(0,0,0,.75)"
                        style={{ fontWeight: 600 }}
                      >
                        {label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </motion.svg>

            {/* 中央 Go 按鈕：top/left 50% + translate 精準置中 */}
            <button
              onClick={onSpin}
              disabled={spinning}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         h-24 w-24 rounded-full grid place-items-center text-lg font-bold shadow-lg
                         bg-black/80 text-white hover:bg-black transition active:scale-[.98] z-10"
              aria-label="開始轉"
            >
              Go
            </button>
          </>
        )}
      </div>

      {winner && !spinning && (
        <p className={`mt-6 text-2xl font-semibold ${theme.textStrong}`}>今天就吃/喝「{winner}」！</p>
      )}

      {/* 快捷切換（連回 Server 解析，避免再度 mismatch） */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <a href="/roulette?meal=breakfast" className="px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:opacity-90">早餐</a>
        <a href="/roulette?meal=main" className="px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:opacity-90">午/晚餐</a>
        <a href="/roulette?meal=drink" className="px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:opacity-90">手搖飲</a>
      </div>

      {/* 項目列表 */}
      <div className="mt-6 max-w-2xl flex flex-wrap justify-center gap-2">
        {items.map((x) => (
          <span key={x} className={`text-xs px-2 py-1 rounded-full ${theme.chip}`}>#{x}</span>
        ))}
      </div>
    </section>
  );
}
