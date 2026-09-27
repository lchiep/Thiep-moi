/**
 * Ảnh nhánh Nữ + vị trí từng vật trong cảnh tulip.
 * Toạ độ theo "tấm ảnh" nền 768×1376 (C3: lụa + đá). Bố cục theo ảnh mẫu Hiệp gửi (27/09):
 * bó hoa bên trái đè lên mép trái phong bì · phong bì to ở giữa-phải, dấu sáp ở mũi nắp (giữa phong bì)
 * · KitKat dưới-phải · cánh hoa rải trên-phải và dưới.
 * Bó hoa + cánh hoa: ảnh tách nền Hiệp gửi. KitKat: tách từ C2. Phong bì: E2 (mở) + E1 (đóng).
 */
const F = '/assets/female/'

export const FEMALE_IMG = {
  sceneBg: F + 'scene-bg.webp',
  bouquet: F + 'bouquet.webp',
  choc: F + 'choc.webp',
  petal1: F + 'petal1.webp',
  petal2: F + 'petal2.webp',
  petal3: F + 'petal3.webp',
  envBack: F + 'env-back.webp',
  envFront: F + 'env-front.webp',
  envClosed: F + 'env-closed.webp',
  flapIn: F + 'env-flap-in.webp',
  flapOut: F + 'env-flap-out.webp',
  letter: F + 'letter.webp',
} as const

export const PLATE = { w: 768, h: 1376 }

/** [x0, y0, x1, y1] trên tấm 768×1376 (được phép âm / tràn: vật thò ra ngoài khung hình như ảnh thật) */
export type Box = readonly [number, number, number, number]

export const PLACE: Record<'bouquet' | 'choc' | 'petal1' | 'petal2' | 'petal3', Box> = {
  bouquet: [-150, 290, 450, 1236],
  choc: [410, 900, 724, 1392],
  petal1: [520, 300, 640, 409],
  petal2: [636, 430, 722, 560],
  petal3: [300, 1180, 396, 1288],
}

/** Chỗ phong bì nằm (khung THÂN phong bì, tỉ lệ 582×435) — to, giữa-phải, nằm DƯỚI bó hoa. */
export const ENVELOPE_SPOT: Box = [290, 560, 690, 859]

/** Tải + giải mã trước toàn bộ ảnh (gọi lúc khách bấm GỬI) → cảnh không bị hiện dần từng ảnh. */
export function preloadFemaleAssets() {
  return Promise.all(
    Object.values(FEMALE_IMG).map(
      (src) =>
        new Promise<void>((ok) => {
          const img = new Image()
          img.src = src
          img.decode().then(ok, ok) // lỗi 1 ảnh không chặn cả cảnh
        }),
    ),
  )
}

export const pct = (b: Box) => ({
  left: `${(b[0] / PLATE.w) * 100}%`,
  top: `${(b[1] / PLATE.h) * 100}%`,
  width: `${((b[2] - b[0]) / PLATE.w) * 100}%`,
})
