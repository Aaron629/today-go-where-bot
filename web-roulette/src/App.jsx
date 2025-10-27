import { useEffect, useMemo, useRef, useState } from 'react'
import RouletteCanvas from './RouletteCanvas'
import { initLiff } from './liffClient'
import './App.css'

const q = new URLSearchParams(location.search)
const getParam = (k, d = '') => q.get(k) ?? d

function normalizeMeal(raw) {
  const m = (raw || 'main').toLowerCase()
  if (m === 'breakfast' || m === 'bf') return 'breakfast'
  if (m === 'drink' || m === 'boba' || m === 'tea') return 'drink'
  // lunch / dinner / main 都歸到 main
  return 'main'
}

function pickIndexByAngle(a, n) {
  if (n <= 0) return 0
  const per = (2 * Math.PI) / n
  const pointer = -Math.PI / 2  // 指針固定在最上方
  // 盤面相對指針的位移角（0~2π）
  let delta = (pointer - a) % (2 * Math.PI)
  if (delta < 0) delta += 2 * Math.PI
  // 加一點 epsilon，避免落在邊界時的浮點誤差
  const idx = Math.floor((delta + 1e-9) / per) % n
  return idx
}

export default function App() {
  const [liff, setLiff] = useState(null)
  const [items, setItems] = useState([])
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [selected, setSelected] = useState(null)
  const raf = useRef(0)

  const mealKey = normalizeMeal(getParam('meal', 'main'))  // 'breakfast' | 'main' | 'drink'
  const title = useMemo(() => ({
    breakfast: '今天吃什麼 · 早餐',
    main:      '今天吃什麼 · 午／晚餐',
    drink:     '今天喝什麼 · 手搖飲',
  }[mealKey]), [mealKey])

  useEffect(() => {
    (async () => {
      const l = await initLiff().catch(() => null)
      setLiff(l)

      // ====== 假資料（之後可改成呼叫 /foods?meal=<breakfast|main|drink>）======
      const DB = {
        breakfast: [
          { name:'阜杭豆漿', description:'厚餅夾蛋、鹹豆漿經典', gmaps:'https://maps.app.goo.gl/?q=阜杭豆漿' },
          { name:'美而美', description:'經典台式早餐', gmaps:'https://maps.app.goo.gl/?q=美而美' },
          { name:'麥味登', description:'連鎖中西式早餐', gmaps:'https://maps.app.goo.gl/?q=麥味登' },
          { name:'永和豆漿', description:'24小時營業經典', gmaps:'https://maps.app.goo.gl/?q=永和豆漿' },
          { name:'早安美芝城', description:'吐司漢堡三明治', gmaps:'https://maps.app.goo.gl/?q=早安美芝城' },
          { name:'丹丹漢堡', description:'南部限定早餐', gmaps:'https://maps.app.goo.gl/?q=丹丹漢堡' },
          { name:'清粥小菜', description:'傳統養生早餐', gmaps:'https://maps.app.goo.gl/?q=清粥小菜' },
          { name:'蛋餅專賣店', description:'各式創意蛋餅', gmaps:'https://maps.app.goo.gl/?q=蛋餅' },
          { name:'飯糰專賣店', description:'紫米飯糰營養滿分', gmaps:'https://maps.app.goo.gl/?q=飯糰' },
          { name:'摩斯漢堡', description:'日式早餐套餐', gmaps:'https://maps.app.goo.gl/?q=摩斯漢堡' },
        ],
        
        main: [
          { name:'八方雲集', description:'鍋貼水餃快速解決', gmaps:'https://maps.app.goo.gl/?q=八方雲集' },
          { name:'爭鮮迴轉壽司', description:'一盤$40起', gmaps:'https://maps.app.goo.gl/?q=爭鮮' },
          { name:'韓式拌飯便當', description:'上班族午餐常見', gmaps:'https://maps.app.goo.gl/?q=韓式拌飯' },
          { name:'熱炒店', description:'下班聚餐好去處', gmaps:'https://maps.app.goo.gl/?q=台式熱炒' },
          { name:'滷肉飯', description:'台灣國民美食', gmaps:'https://maps.app.goo.gl/?q=滷肉飯' },
          { name:'牛肉麵', description:'紅燒清燉任選', gmaps:'https://maps.app.goo.gl/?q=牛肉麵' },
          { name:'拉麵店', description:'豚骨味噌醬油', gmaps:'https://maps.app.goo.gl/?q=拉麵' },
          { name:'義式餐廳', description:'義大利麵燉飯披薩', gmaps:'https://maps.app.goo.gl/?q=義大利餐廳' },
          { name:'定食套餐', description:'日式主餐配小菜', gmaps:'https://maps.app.goo.gl/?q=日式定食' },
          { name:'泰式料理', description:'酸辣過癮開胃', gmaps:'https://maps.app.goo.gl/?q=泰式料理' },
          { name:'鐵板燒', description:'現煎熱騰騰', gmaps:'https://maps.app.goo.gl/?q=鐵板燒' },
          { name:'便當店', description:'CP值高吃飽飽', gmaps:'https://maps.app.goo.gl/?q=便當' },
        ],
        
        drink: [
          { name:'五十嵐', description:'青茶／奶茶經典款', gmaps:'https://maps.app.goo.gl/?q=五十嵐' },
          { name:'清心福全', description:'多冰塊甜度客製', gmaps:'https://maps.app.goo.gl/?q=清心福全' },
          { name:'珍煮丹', description:'黑糖珍珠鮮奶', gmaps:'https://maps.app.goo.gl/?q=珍煮丹' },
          { name:'迷客夏', description:'鮮奶茶系', gmaps:'https://maps.app.goo.gl/?q=迷客夏' },
          { name:'COCO', description:'經典手搖', gmaps:'https://maps.app.goo.gl/?q=COCO' },
          { name:'茶湯會', description:'珍珠奶茶創始', gmaps:'https://maps.app.goo.gl/?q=茶湯會' },
          { name:'一芳', description:'水果茶系列', gmaps:'https://maps.app.goo.gl/?q=一芳' },
          { name:'麻古茶坊', description:'芝芝系列必喝', gmaps:'https://maps.app.goo.gl/?q=麻古茶坊' },
          { name:'萬波', description:'楊枝甘露招牌', gmaps:'https://maps.app.goo.gl/?q=萬波' },
          { name:'茶的魔手', description:'便宜大杯實在', gmaps:'https://maps.app.goo.gl/?q=茶的魔手' },
          { name:'星巴克', description:'咖啡星冰樂', gmaps:'https://maps.app.goo.gl/?q=星巴克' },
          { name:'路易莎', description:'咖啡輕食舒適', gmaps:'https://maps.app.goo.gl/?q=路易莎' },
        ],
      };
      setItems(DB[mealKey] || DB.main)
      // ===============================================================
    })()
  }, [mealKey])

  // 指針計算角度，顯示對應資料
  const onSpin = () => {
    if (spinning || items.length === 0) return
    setSelected(null)
    setSpinning(true)

    let v = 0.35 + Math.random() * 0.25
    const friction = 0.985
    let curr = angle // 以當前角度為起點，之後都用 curr 計算

    const step = () => {
      curr += v                // 更新當前角度
      setAngle(curr)           // 通知畫面重繪
      v *= friction
      if (v < 0.002) {
        setSpinning(false)
        const idx = pickIndexByAngle(curr, items.length) // 用 curr（最新角度）算
        setSelected(items[idx])
        cancelAnimationFrame(raf.current)
      } else {
        raf.current = requestAnimationFrame(step)
      }
    }
    raf.current = requestAnimationFrame(step)
  }

  const onSend = async () => {
    if (!selected) return
    if (!liff) {
      await navigator.clipboard?.writeText(`${title}：${selected.name}\n${selected.gmaps ?? ''}`)
      alert('已複製結果，請貼到聊天中')
      return
    }
    const flex = {
      type:'bubble',
      body:{ type:'box', layout:'vertical', contents:[
        { type:'text', text:selected.name, weight:'bold', size:'lg', wrap:true },
        ...(selected.description ? [{ type:'text', text:selected.description, size:'sm', color:'#555', wrap:true }] : [])
      ]},
      footer:{ type:'box', layout:'vertical', spacing:'sm', contents:[
        ...(selected.gmaps ? [{ type:'button', style:'link', action:{ type:'uri', label:'Google 地圖', uri:selected.gmaps } }] : [])
      ]}
    }
    await liff.sendMessages([{ type:'flex', altText:`${title}：${selected.name}`, contents:flex }])
    liff.closeWindow()
  }

  const reload = () => { setAngle(0); setSelected(null) }

  return (
    <div className="wrap">
      <h1 className="title">{title} 🎡</h1>
      <div className="subtitle">
        支援參數：<code>?meal=breakfast</code>、<code>?meal=main</code>、<code>?meal=drink</code>
        （相容：<code>?meal=lunch</code>/<code>?meal=dinner</code> → <code>main</code>）
      </div>

      <div className="card">
        <div className="card-head">
          <span className="muted">候選 {items.length} 筆</span>
          <button onClick={reload} className="btn ghost">重載</button>
        </div>

        <RouletteCanvas items={items} angle={angle} />

        <div className="actions">
          <button onClick={onSpin} disabled={spinning || items.length===0}
            className={`btn primary ${spinning ? 'spinning' : ''}`}>
            {spinning ? '旋轉中…' : '開始旋轉'}
          </button>
          <button onClick={onSend} disabled={!selected} className="btn secondary">
            送回聊天室
          </button>
        </div>

        {selected && (
          <div className="result">
            <h2>{selected.name}</h2>
            {selected.description && <p>{selected.description}</p>}
            {selected.gmaps && <p><a href={selected.gmaps} target="_blank" rel="noreferrer">在 Google 地圖開啟</a></p>}
          </div>
        )}
      </div>
    </div>
  )
}
