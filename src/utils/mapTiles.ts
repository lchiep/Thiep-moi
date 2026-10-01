import { EVENT } from '../config/event'

/**
 * Ô bản đồ quanh trường được tải SẴN vào public/assets/map (scripts/fetch-map-tiles.mjs, chạy trước build)
 * → hiện ngay từ chính web, không đợi máy chủ OpenStreetMap. Ngoài vùng đó dùng ô online.
 * LOCAL_RADIUS PHẢI khớp với script.
 */
export const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const MAP_ZOOM = 16
const LOCAL_RADIUS: Record<number, number> = { 15: 1, 16: 2, 17: 2 }

export function tileXY(lat: number, lng: number, z: number) {
  const n = 2 ** z
  const x = Math.floor(((lng + 180) / 360) * n)
  const rad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n)
  return { x, y }
}

const fill = (u: string, z: number, x: number, y: number) =>
  u.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y))

export const osmTile = (z: number, x: number, y: number) => fill(OSM_URL, z, x, y)

/** Ô (z,x,y) có nằm trong vùng đã tải sẵn không → URL ảnh trên chính web, không thì null. */
export function localTile(z: number, x: number, y: number) {
  const r = LOCAL_RADIUS[z]
  if (r === undefined) return null
  const c = tileXY(EVENT.lat, EVENT.lng, z)
  if (Math.abs(x - c.x) > r || Math.abs(y - c.y) > r) return null
  return `/assets/map/${z}/${x}/${y}.png`
}

/** URL tốt nhất cho 1 ô: ô có sẵn trên web, không có thì OpenStreetMap. */
export const bestTile = (z: number, x: number, y: number) => localTile(z, x, y) ?? osmTile(z, x, y)
