// src/app/roulette/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "三餐輪盤｜今天去哪兒",
  description: "早餐、午晚餐、手搖飲的隨機決定輪盤。",
};

type SearchParams = { meal?: string };

export default async function RoulettePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const raw = (params?.meal ?? "main").toLowerCase();

  // lunch/dinner 都歸到 main（若你後端已處理，也可省略）
  const meal =
    raw === "breakfast" || raw === "drink" ? raw :
    raw === "lunch" || raw === "dinner" ? "main" : "main";

  const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  // 直接指到你 GCP 上的 LIFF 版輪盤
  const src = `${base}/liff/roulette/?meal=${encodeURIComponent(meal)}&embed=1`;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">三餐輪盤</h1>

      <div className="flex gap-2">
        <a className="px-3 py-1 rounded bg-amber-500 text-white" href="/roulette?meal=breakfast">早餐</a>
        <a className="px-3 py-1 rounded bg-teal-600 text-white" href="/roulette?meal=main">午/晚餐</a>
        <a className="px-3 py-1 rounded bg-violet-600 text-white" href="/roulette?meal=drink">手搖飲</a>
      </div>

      <div className="rounded-xl border overflow-hidden bg-white">
        <iframe
          key={src}
          src={src}
          className="w-full aspect-[3/4] sm:aspect-[16/9] border-0"
          allow="clipboard-write; clipboard-read"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* 方便除錯：看實際 iframe src */}
      <p className="text-sm text-neutral-400 break-all">iframe src: {src}</p>
    </section>
  );
}
