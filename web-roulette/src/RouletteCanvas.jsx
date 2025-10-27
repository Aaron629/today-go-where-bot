import { useEffect, useRef } from 'react'

export default function RouletteCanvas({ items, angle }) {
  const ref = useRef(null)

  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const r = c.width / 2
    const n = Math.max(items.length, 1)
    const per = 2 * Math.PI / n

    ctx.clearRect(0, 0, c.width, c.height)

    for (let i = 0; i < n; i++) {
      ctx.beginPath()
      ctx.moveTo(r, r)
      ctx.arc(r, r, r, angle + i * per, angle + (i + 1) * per)
      ctx.closePath()
      ctx.fillStyle = `hsl(${((i * 360) / n) | 0}, 70%, 60%)`
      ctx.fill()

      if (items[i]) {
        ctx.save()
        ctx.translate(r, r)
        ctx.rotate(angle + (i + 0.5) * per)
        ctx.textAlign = 'right'
        ctx.font = '14px system-ui,Arial'
        ctx.fillStyle = '#111'
        const t = items[i].name.length > 12 ? items[i].name.slice(0, 12) + '…' : items[i].name
        ctx.fillText(t, r - 12, 5)
        ctx.restore()
      }
    }

    // 指針（頂部）
    ctx.beginPath()
    ctx.moveTo(r, 8)
    ctx.lineTo(r - 10, 28)
    ctx.lineTo(r + 10, 28)
    ctx.closePath()
    ctx.fillStyle = '#111'
    ctx.fill()
  }, [items, angle])

  return <canvas ref={ref} width={360} height={360} style={{ width: '100%', maxWidth: 340 }} />
}
