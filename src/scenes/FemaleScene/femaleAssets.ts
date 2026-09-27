/**
 * Ảnh nhánh Nữ + vị trí từng vật trong cảnh tulip.
 * Toạ độ theo khung ảnh gốc 768×1376 (tách lớp từ ảnh Hiệp tạo: C1 hoa, C2 KitKat + cánh hoa, C3 nền lụa + đá).
 * Component đặt vật bằng % của "tấm ảnh" này → mọi cỡ màn đều khớp đúng chỗ trên nền.
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
  flapIn: F + 'env-flap-in.webp',
  flapOut: F + 'env-flap-out.webp',
  letter: F + 'letter.webp',
  seal: '/assets/invitation/seal.webp',
} as const

export const PLATE = { w: 768, h: 1376 }

/** [x0, y0, x1, y1] trên tấm 768×1376 */
export type Box = readonly [number, number, number, number]

/** Hoa dời xuống một chút (so với ảnh gốc) để chừa khoảng lụa phía trên cho phong bì. */
const BOUQUET_DROP = 150

export const PLACE: Record<'bouquet' | 'choc' | 'petal1' | 'petal2' | 'petal3', Box> = {
  bouquet: [3, 249 + BOUQUET_DROP, 563, 1365 + BOUQUET_DROP],
  choc: [429, 762, 743, 1254],
  petal1: [572, 217, 692, 340],
  petal2: [637, 451, 760, 579],
  petal3: [568, 1201, 701, 1337],
}

/** Chỗ phong bì nằm yên trên lụa (khung THÂN phong bì — nắp đã đóng nằm trong khung này). */
export const ENVELOPE_SPOT: Box = [255, 115, 615, 390]

/** Tỉ lệ ảnh phong bì (px ảnh gốc E2): thân 582×444, nắp 582×388 */
export const ENV = { bodyW: 582, bodyH: 444, flapH: 388 }

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
