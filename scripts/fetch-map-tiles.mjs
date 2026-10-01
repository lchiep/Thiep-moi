/**
 * Tải SẴN vài chục ô bản đồ quanh trường vào public/assets/map/{z}/{x}/{y}.png
 * → bản đồ trong thiệp hiện NGAY (ảnh nằm cùng web trên Vercel), không phải đợi máy chủ OpenStreetMap.
 * Ngoài vùng này (kéo xa / zoom khác) bản đồ vẫn tải từ OpenStreetMap như cũ.
 *
 * Chạy tay: node scripts/fetch-map-tiles.mjs   (tự chạy trước `npm run build`)
 * Ô nào đã có thì bỏ qua → chỉ tải 1 lần, nên commit thư mục public/assets/map.
 * Lỗi mạng không làm hỏng build (web tự dùng ô online thay thế).
 *
 * Phạm vi PHẢI khớp với src/utils/mapTiles.ts (LOCAL_RADIUS).
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'map')
const LAT = Number(process.env.VITE_EVENT_LAT || '21.000064705312877')
const LNG = Number(process.env.VITE_EVENT_LNG || '105.87777846990927')
const LOCAL_RADIUS = { 15: 1, 16: 2, 17: 2 } // 3×3, 5×5, 5×5 ô

function tileXY(lat, lng, z) {
  const n = 2 ** z
  const x = Math.floor(((lng + 180) / 360) * n)
  const r = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n)
  return { x, y }
}
const exists = (p) => access(p).then(() => true, () => false)

let got = 0, have = 0, fail = 0
for (const [zs, rad] of Object.entries(LOCAL_RADIUS)) {
  const z = Number(zs)
  const c = tileXY(LAT, LNG, z)
  for (let dx = -rad; dx <= rad; dx++) {
    for (let dy = -rad; dy <= rad; dy++) {
      const x = c.x + dx, y = c.y + dy
      const file = join(ROOT, String(z), String(x), `${y}.png`)
      if (await exists(file)) { have++; continue }
      try {
        const res = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
          headers: { 'User-Agent': 'thiep-moi-graduation-gala/1.0 (one-time cache of ~60 tiles)', Referer: 'https://thiep-moi-three.vercel.app/' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, Buffer.from(await res.arrayBuffer()))
        got++
      } catch (e) {
        fail++
        if (fail === 1) console.warn(`[map] không tải được ô ${z}/${x}/${y}: ${e.message}`)
      }
    }
  }
}
console.log(`[map] ô bản đồ: có sẵn ${have}, vừa tải ${got}, lỗi ${fail}`)
