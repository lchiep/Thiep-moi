import { EVENT } from '../config/event'
import { MAP_ZOOM, bestTile, tileXY } from './mapTiles'

/**
 * Làm nóng bản đồ TRƯỚC khi khách mở trang thiệp:
 *  - tải sẵn mã Leaflet (chunk động)
 *  - mở sẵn kết nối tới máy chủ ô bản đồ (DNS + TLS là phần chậm nhất ở VN)
 *  - ô quanh trường lấy từ chính web (đã tải sẵn, xem mapTiles.ts) → gần như tức thì
 *  - tải sẵn 3×3 ô bản đồ quanh ghim ở mức zoom mở đầu → khi Leaflet dựng, ô đã nằm trong cache trình duyệt.
 * Gọi 1 lần (idempotent). Không ảnh hưởng animation (chỉ mạng, chạy nền).
 */
export { MAP_ZOOM }

let warmed = false

export function warmMap() {
  if (warmed || typeof document === 'undefined') return
  warmed = true
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = 'https://tile.openstreetmap.org'
  link.crossOrigin = ''
  document.head.appendChild(link)
  void import('leaflet')
  void import('leaflet/dist/leaflet.css')
  const { x, y } = tileXY(EVENT.lat, EVENT.lng, MAP_ZOOM)
  // ô ở giữa tải trước, rồi tới các ô kề
  const order = [[0, 0], [0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]
  for (const [dx, dy] of order) {
    const img = new Image()
    img.decoding = 'async'
    img.src = bestTile(MAP_ZOOM, x + dx, y + dy)
  }
}
