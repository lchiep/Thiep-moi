import { useEffect, useRef } from 'react'
import type { Map as LMap } from 'leaflet'
import { EVENT } from '../../config/event'
import './MapPreview.css'

/**
 * Bản đồ xem trước — bản đồ THẬT (nền OpenStreetMap), dựng bằng Leaflet.
 *  - Phóng to / thu nhỏ thật: chụm 2 ngón, lăn chuột, nút + / −. Thu nhỏ → thấy rộng khu xung quanh.
 *  - Ghim đỏ đô CỐ ĐỊNH cỡ (không phình to khi zoom gần).
 *  - Điện thoại: 1 ngón vẫn cuộn trang thiệp, 2 ngón để chụm/kéo bản đồ.
 *  - Không có link nào bấm ra ngoài; mở Google Maps bằng nút "XEM BẢN ĐỒ" bên dưới.
 * Leaflet chỉ tải khi trang thiệp mở (import động) → không làm nặng màn đầu.
 */
const PIN = `<svg viewBox="0 0 32 42" width="30" height="40" aria-hidden="true">
  <path d="M16 41s13-14.2 13-24.5A13 13 0 0 0 3 16.5C3 26.8 16 41 16 41z" fill="#6e1f2a" stroke="#fdf8ee" stroke-width="2"/>
  <circle cx="16" cy="16.5" r="5" fill="#fdf8ee"/>
</svg>`

export default function MapPreview() {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: LMap | null = null
    let dead = false
    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (dead || !box.current) return
      const at: [number, number] = [EVENT.lat, EVENT.lng]
      const touch = window.matchMedia('(pointer: coarse)').matches
      map = L.map(box.current, {
        center: at,
        zoom: 16,
        minZoom: 12,
        maxZoom: 19,
        zoomSnap: 0.5,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
        dragging: !touch, // điện thoại: 1 ngón cuộn trang; 2 ngón chụm (touchZoom) vẫn kéo được
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: false,
      })
      // nền OpenStreetMap chuẩn (CARTO nay đòi API key → hiện chữ "API KEY REQUIRED")
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map)
      map.attributionControl.setPrefix(false)
      L.control.zoom({ position: 'bottomright', zoomInTitle: 'Phóng to', zoomOutTitle: 'Thu nhỏ' }).addTo(map)
      L.marker(at, {
        icon: L.divIcon({ html: PIN, className: 'inv__pin', iconSize: [30, 40], iconAnchor: [15, 40] }),
        keyboard: false,
        interactive: false,
      }).addTo(map)
    })()
    return () => {
      dead = true
      map?.remove()
    }
  }, [])

  return <div className="inv__map" ref={box} aria-label="Bản đồ vị trí buổi lễ (chỉ xem)" />
}
