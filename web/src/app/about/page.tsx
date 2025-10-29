import { motion } from "framer-motion";
import { 
  Compass, MapPin, Sparkles, Clock, Zap, Globe, Layers, Database, Cloud, Shield, Github, Rocket
} from "lucide-react";

export default function AboutPage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  const features = [
    {
      icon: <Compass className="w-5 h-5" />, title: "今天推薦",
      desc: "依城市/天氣/熱門度動態挑選 1–3 個精選提案，快速決策不當機。"
    },
    {
      icon: <MapPin className="w-5 h-5" />, title: "區域快選",
      desc: "先選城市與行政區，再從六大分類（景點/散步/美食…）快速過濾。"
    },
    {
      icon: <Sparkles className="w-5 h-5" />, title: "美食輪盤",
      desc: "在猶豫不決時，一鍵抽選餐廳，支援標籤與價格帶限制。"
    },
    {
      icon: <Clock className="w-5 h-5" />, title: "即時可用",
      desc: "LINE Bot 與 Web 版同步維護，資訊即時更新、零學習成本。"
    },
    {
      icon: <Globe className="w-5 h-5" />, title: "多語素材預備",
      desc: "資料模型已預留多語欄位，未來支援 EN / JP / KR 擴展。"
    },
    {
      icon: <Zap className="w-5 h-5" />, title: "高可用架構",
      desc: "Cloud Run 無伺服器部署、水平擴展，流量尖峰自動撐住。"
    },
  ];

  const stack = [
    { name: "Frontend", items: ["Next.js", "React", "TailwindCSS", "Framer Motion"] },
    { name: "Backend", items: ["FastAPI", "GraphQL (Strawberry)", "SQLModel / Pydantic v2"] },
    { name: "Data", items: ["PostgreSQL (Cloud SQL)", "Redis(規劃)", "ELK Observability(規劃)"] },
    { name: "Infra", items: ["GCP Cloud Run", "Cloud Storage", "Cloud Build / GitHub Actions"] },
    { name: "Ops", items: ["CI/CD", "OpenAPI/GraphQL Docs", "SLO / Alert(規劃)"] },
  ];

  const milestones = [
    { date: "2025-07", text: "V0 概念驗證：台北市景點資料整理、LINE Bot 初版" },
    { date: "2025-09", text: "V1 上線：Cloud Run + Cloud SQL，食物輪盤 & 今日推薦" },
    { date: "2025-10", text: "V1.2：城市/行政區快選、前端重構、GraphQL 聚合查詢" },
    { date: "Q4 2025", text: "規劃：新北/台中/高雄擴充、營運儀表板、A/B Test" },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      {/* Hero */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">關於「今天去哪兒」</h1>
        <p className="mt-3 text-muted-foreground">
          一個幫你在 <span className="font-medium">最短時間內</span> 決定行程的在地生活指南。
          以「少即是多」為原則，提供可執行的精選建議與乾淨的體驗。
        </p>
      </motion.div>

      {/* Value props */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {features.map((f, i) => (
          <div key={i} className="rounded-2xl border bg-white/50 backdrop-blur p-4 shadow-sm hover:shadow transition">
            <div className="flex items-center gap-2 font-semibold">
              <span className="inline-flex items-center justify-center rounded-xl border w-9 h-9">
                {f.icon}
              </span>
              {f.title}
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-6">{f.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { k: "城市覆蓋", v: "4+" },
          { k: "景點/店家", v: "200+" },
          { k: "平均回覆", v: "<200ms" },
          { k: "可用性", v: ">=99.9%" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border p-4 text-center">
            <div className="text-2xl font-bold">{s.v}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.k}</div>
          </div>
        ))}
      </motion.div>

      {/* Tech Stack */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-12"
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5" /> 技術棧
        </h2>
        <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stack.map((g, i) => (
            <div key={i} className="rounded-2xl border p-4">
              <div className="text-sm font-medium opacity-80">{g.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.items.map((it, j) => (
                  <span key={j} className="text-xs rounded-full border px-2 py-1 bg-white/60">
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Deployment & Architecture */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-12"
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Cloud className="w-5 h-5" /> 部署架構（GCP）
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <h3 className="font-medium flex items-center gap-2"><Database className="w-4 h-4" /> Data Flow</h3>
            <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>資料來源：人工整理 + 開放資料（地標、行政區、營業資訊）。</li>
              <li>資料庫：PostgreSQL（Cloud SQL），採 <span className="font-mono">spot / tag / city / district</span> 等實體。</li>
              <li>API：FastAPI + GraphQL 聚合查詢，前端以 SWR/React Query 快取。</li>
              <li>媒體：圖片與靜態資源存放於 Cloud Storage（GCS）。</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-4">
            <h3 className="font-medium flex items-center gap-2"><Shield className="w-4 h-4" /> Runtime</h3>
            <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>前端：Next.js（SSG/ISR + Edge Runtime 規劃）。</li>
              <li>後端：Cloud Run 無伺服器，水平擴展、零維運機器管理。</li>
              <li>觀測性：日誌集中（ELK 規劃中）、指標與告警（Uptime/Cloud Monitoring）。</li>
              <li>CI/CD：GitHub Actions + Cloud Run Deploy，自動化測試與版本標記。</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border p-4 bg-white/60">
          <pre className="text-xs leading-6 overflow-x-auto"><code>{`Client (LINE / Web)
  └─▶ Next.js (App Router / Edge) 
       └─▶ API Gateway (GraphQL + REST)
            ├─▶ FastAPI (Business / Caching)
            ├─▶ Cloud SQL (PostgreSQL)
            └─▶ Cloud Storage (Images/Assets)
`}</code></pre>
        </div>
      </motion.div>

      {/* Milestones */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-12"
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Rocket className="w-5 h-5" /> 里程碑
        </h2>
        <ol className="mt-4 relative border-s ps-6 space-y-4">
          {milestones.map((m, i) => (
            <li key={i} className="ms-4">
              <div className="absolute -start-1.5 mt-1.5 w-3 h-3 rounded-full border bg-white" />
              <div className="text-sm font-semibold">{m.date}</div>
              <p className="text-sm text-muted-foreground mt-1">{m.text}</p>
            </li>
          ))}
        </ol>
      </motion.div>

      {/* FAQ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-12 rounded-2xl border p-4"
      >
        <h2 className="text-xl font-semibold">常見問題</h2>
        <div className="mt-4 space-y-4">
          <details className="group rounded-xl border p-4">
            <summary className="cursor-pointer list-none font-medium">資料從哪裡來？如何確保正確性？</summary>
            <p className="mt-2 text-sm text-muted-foreground">
              目前以人工整理搭配公開資料來源為主，並配合社群回饋機制。每筆資料皆含城市、行政區、分類、營業資訊與標籤，未來將導入半自動化監控（如營業時間變動）。
            </p>
          </details>
          <details className="group rounded-xl border p-4">
            <summary className="cursor-pointer list-none font-medium">我可以投稿或回報錯誤嗎？</summary>
            <p className="mt-2 text-sm text-muted-foreground">
              可以！歡迎透過 LINE Bot 或 GitHub Issue 提供建議或修正資訊，將在下一次資料釋出中更新。
            </p>
          </details>
          <details className="group rounded-xl border p-4">
            <summary className="cursor-pointer list-none font-medium">未來規劃有哪些？</summary>
            <p className="mt-2 text-sm text-muted-foreground">
              近期會擴充新北/台中/高雄，並加入「依心情推薦」與「同款路線」功能；長期規劃串接 IoT/天氣資料，提供更智慧的外出建議。
            </p>
          </details>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-12 rounded-2xl border p-6 bg-gradient-to-br from-white to-slate-50 text-center"
      >
        <p className="text-sm text-muted-foreground">喜歡這個專案嗎？歡迎追蹤並參與開發</p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:shadow">
            <Github className="w-4 h-4" /> GitHub Repo
          </a>
          <a href="/" className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:shadow">
            <MapPin className="w-4 h-4" /> 立刻開始逛逛
          </a>
        </div>
      </motion.div>

      {/* Footer note */}
      <p className="mt-10 text-xs text-center text-muted-foreground">
        © {new Date().getFullYear()} 今天去哪兒 · Built with Next.js & Cloud Run
      </p>
    </section>
  );
}
