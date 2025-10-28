export default function HomePage() {
  return (
    <section className="space-y-10">
      <div className="rounded-2xl p-8 md:p-12 bg-gradient-to-br from-amber-200/60 to-amber-100/40 border border-black/10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          今天去哪兒 · 官方網站
        </h1>
        <p className="mt-4 text-black/70">
          用三餐輪盤，10 秒決定吃什麼、喝什麼。支援 LINE Bot 與 Web 版本。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/roulette?meal=breakfast" className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:opacity-90">早餐吃什麼</a>
          <a href="/roulette?meal=main" className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:opacity-90">午/晚餐吃什麼</a>
          <a href="/roulette?meal=drink" className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:opacity-90">手搖喝什麼</a>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <a href="/spots" className="rounded-xl border p-5 hover:bg-black/5">
          <div className="font-semibold">隨機景點</div>
          <p className="text-sm text-black/60 mt-1">（預留）之後接你的景點資料庫</p>
        </a>
        <a href="/about" className="rounded-xl border p-5 hover:bg-black/5">
          <div className="font-semibold">關於</div>
          <p className="text-sm text-black/60 mt-1">專案介紹、技術棧、聯絡方式</p>
        </a>
        <a href="https://line.me/R" target="_blank" className="rounded-xl border p-5 hover:bg-black/5">
          <div className="font-semibold">加入 LINE Bot</div>
          <p className="text-sm text-black/60 mt-1">（放上你的官方帳號連結）</p>
        </a>
      </div>
    </section>
  );
}
