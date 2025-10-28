// src/RouletteCanvas.jsx
import { useEffect, useRef } from 'react'

function pickIndexByAngle(a, n) {
  if (n <= 0) return 0
  const per = (2 * Math.PI) / n
  const pointer = -Math.PI / 2
  let delta = (pointer - a) % (2 * Math.PI)
  if (delta < 0) delta += 2 * Math.PI
  const idx = Math.floor((delta + 1e-9) / per) % n
  return idx
}

export default function RouletteCanvas({
  items = [],
  angle = 0,               // 由父層控制的角度（弧度）
  size = 360,              // 畫布 CSS 大小（px）
  ringWidth = 52,          // 外圈厚度
  fontFamily = "'Segoe UI','Microsoft JhengHei',system-ui,sans-serif",
  colors,                  // 可手動傳 palette；不傳則讀 CSS 變數
  showPointer = true,
  themeKey,                // 用來觸發主題重抓
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // 讀取主題顏色（就近讀父容器，沒有就 fallback 到 body）
    let theme
    let segText, segTextActive, segStroke, segHiStroke, centerFill, pinStroke
    if (colors && colors.length) {
      theme = { seg: colors, pin: '#1d3557' }
      segText = 'rgba(0,0,0,.72)'
      segTextActive = 'rgba(0,0,0,.86)'
      segStroke = 'rgba(0,0,0,.06)'
      segHiStroke = 'rgba(255,255,255,.9)'
      centerFill = '#fff'
      pinStroke = 'rgba(0,0,0,.2)'
    } else {
      const el = canvas.parentElement || document.body
      const cs = getComputedStyle(el)
      theme = {
        seg: [
          cs.getPropertyValue('--seg-1').trim() || '#cde1ff',
          cs.getPropertyValue('--seg-2').trim() || '#e6f0ff',
          cs.getPropertyValue('--seg-3').trim() || '#b3d3ff',
        ],
        pin: cs.getPropertyValue('--pin').trim() || '#1d3557',
      }
      segText        = cs.getPropertyValue('--seg-text').trim()              || 'rgba(0,0,0,.72)'
      segTextActive  = cs.getPropertyValue('--seg-text-active').trim()       || 'rgba(0,0,0,.86)'
      segStroke      = cs.getPropertyValue('--seg-stroke').trim()            || 'rgba(0,0,0,.06)'
      segHiStroke    = cs.getPropertyValue('--seg-highlight-stroke').trim()  || 'rgba(255,255,255,.9)'
      centerFill     = cs.getPropertyValue('--center-fill').trim()           || '#fff'
      pinStroke      = cs.getPropertyValue('--pointer-stroke').trim()        || 'rgba(0,0,0,.2)'
    }

    // HiDPI：讓畫面更銳利
    const dpr = window.devicePixelRatio || 1
    const w = size
    const h = size
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 先清空畫布，避免殘影
    ctx.clearRect(0, 0, w, h)

    const cx = w / 2
    const cy = h / 2
    const R = Math.min(cx, cy) - 4              // 外半徑
    const r = Math.max(R - ringWidth, 40)       // 內半徑
    const N = Math.max(items.length, 1)
    const per = (2 * Math.PI) / N

    // 背景陰影
    ctx.save()
    ctx.translate(cx, cy)
    ctx.shadowColor = 'rgba(0,0,0,.12)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 6
    ctx.fillStyle = 'rgba(255,255,255,.04)'
    ctx.beginPath()
    ctx.arc(0, 0, R + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 目前選中的 index（依指針在最上方）
    const selectedIdx = pickIndexByAngle(angle, items.length)

    // 轉動整個盤面
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)

    // 畫每個扇形
    for (let i = 0; i < N; i++) {
      const start = i * per
      const end = start + per
      const c = theme.seg[i % theme.seg.length]

      // 扇形底色
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, R, start, end)
      ctx.closePath()
      ctx.fillStyle = c
      ctx.fill()

      // 內圈挖空成圓環形
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(0, 0, r, start, end)
      ctx.lineTo(0, 0)
      ctx.closePath()
      ctx.fill()

      // 切回正常混合
      ctx.globalCompositeOperation = 'source-over'

      // 扇形描邊（細分隔線）
      ctx.strokeStyle = segStroke
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, 0, R - 0.5, start, end)
      ctx.stroke()

      // 高亮選中區塊（加外圈描邊 + 內圈光暈）
      if (i === selectedIdx) {
        // 外圈亮邊
        ctx.strokeStyle = segHiStroke
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(0, 0, R - 1.2, start + 0.02, end - 0.02)
        ctx.stroke()

        // 內圈光暈
        ctx.save()
        ctx.globalAlpha = 0.18
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, R, start, end)
        ctx.arc(0, 0, r + 8, end, start, true)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // 文字：沿 bisector 放
      const label = items[i]?.name ?? ''
      if (label) {
        ctx.save()
        // 轉到扇形中心線
        const mid = start + per / 2
        ctx.rotate(mid)
        // 文字位置在圓環中線
        const tR = (R + r) / 2
        ctx.translate(tR, 0)
        ctx.rotate(Math.PI / 2) // 文字正向
        ctx.fillStyle = segText
        ctx.font = `600 14px ${fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // 控制字數：太長就截斷加 …
        const maxWidth = per * tR * 0.9 // 粗略估最大寬
        let text = label
        if (ctx.measureText(text).width > maxWidth) {
          while (text && ctx.measureText(text + '…').width > maxWidth) {
            text = text.slice(0, -1)
          }
          text += '…'
        }

        // 選中時字體稍微放大
        if (i === selectedIdx) {
          ctx.font = `700 15px ${fontFamily}`
          ctx.fillStyle = segTextActive
        }
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }
    }

    // 中軸（中心圓 + 光澤）
    ctx.save()
    ctx.fillStyle = centerFill
    ctx.shadowColor = 'rgba(0,0,0,.15)'
    ctx.shadowBlur = 16
    ctx.beginPath()
    ctx.arc(0, 0, r - 10, 0, Math.PI * 2)
    ctx.fill()
    // 內圈描邊
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(0,0,0,.08)'
    ctx.stroke()

    // 光澤
    const grd = ctx.createRadialGradient(-8, -8, 6, 0, 0, r - 10)
    grd.addColorStop(0, 'rgba(255,255,255,.8)')
    grd.addColorStop(0.3, 'rgba(255,255,255,.2)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(0, 0, r - 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
    ctx.restore()

    // 指針（固定在最上方）
    if (showPointer) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.fillStyle = theme.pin
      ctx.strokeStyle = pinStroke
      ctx.lineWidth = 1

      // 三角指針
      const pw = 18
      const ph = 28
      ctx.beginPath()
      ctx.moveTo(0, -(R + 6))
      ctx.lineTo(-pw / 2, -(R - ph))
      ctx.lineTo(pw / 2, -(R - ph))
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // 針腳圓點
      ctx.shadowColor = 'rgba(0,0,0,.15)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(0, -(R - ph) + 6, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  // 依賴包含 themeKey / colors，切主題或 palette 時會重繪
  }, [items, angle, size, ringWidth, fontFamily, showPointer, themeKey, colors])

  return <canvas ref={canvasRef} />
}
