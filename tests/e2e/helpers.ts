import { expect, type Locator, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const SHOT_CSS = fileURLToPath(new URL('./screenshot.css', import.meta.url))
export const PHOTO = fileURLToPath(new URL('../fixtures/guest-photo.jpg', import.meta.url))

type Win = Window & {
  __send?: (e: string) => boolean
  __maleTargets?: () => { card: { x: number; y: number }; ticket: { x: number; y: number } } | null
}

/** Mở trang ở chế độ kiểm thử (?qa) + dữ liệu mẫu; chặn ảnh nền bản đồ cho ảnh chụp ổn định. */
export async function openApp(page: Page, query = '') {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route(/tile\.openstreetmap\.org/, (r) => r.abort())
  await page.goto(`/?qa${query ? '&' + query : ''}`)
  await waitState(page, 'CALL_IDLE')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1800) // chữ + nút màn cuộc gọi hiện xong
  return errors
}

/** Chờ state machine tới đúng trạng thái (main.tsx ghi ra <html data-exp>). */
export async function waitState(page: Page, state: string, timeout = 60_000) {
  await expect(page.locator('html')).toHaveAttribute('data-exp', state, { timeout })
}

export const send = (page: Page, event: string) => page.evaluate((e) => (window as Win).__send!(e), event)

/** Vuốt thật trên thanh "slide to answer" (chuột = ngón tay): nhấn → kéo từng bước → thả. */
export async function swipeToAnswer(page: Page) {
  const knob = page.locator('.sta__knob')
  const track = page.locator('.sta__track')
  const k = (await knob.boundingBox())!
  const t = (await track.boundingBox())!
  const y = k.y + k.height / 2
  await page.mouse.move(k.x + k.width / 2, y)
  await page.mouse.down()
  // kéo quá cuối thanh một đoạn: núm có lực cản (dragResistance) nên đi chậm hơn ngón tay
  const dist = t.width + 100
  for (let i = 1; i <= 20; i++) await page.mouse.move(k.x + k.width / 2 + (dist * i) / 20, y)
  await page.mouse.up()
}

/** Mở popup: vuốt nghe máy → chờ popup mở hẳn. */
export async function openPopup(page: Page) {
  await swipeToAnswer(page)
  await waitState(page, 'RSVP_OPEN')
  await page.locator('.gp__submit').waitFor({ state: 'visible' })
  await page.waitForTimeout(1200) // kính + form hiện xong (timeline mở popup)
}

/** Popup đã có dữ liệu mẫu (dev) → chỉ cần chọn ảnh. */
export async function pickPhoto(page: Page) {
  await page.locator('.gp input[type="file"]').setInputFiles(PHOTO)
  await expect(page.locator('.gp__submit')).toHaveClass(/is-ready/)
}

/** Vuốt trên phần tử (x/y theo pixel so với tâm của nó). */
export async function swipeOn(page: Page, el: Locator, dx: number, dy: number) {
  const b = (await el.boundingBox())!
  const x = b.x + b.width / 2, y = b.y + b.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) await page.mouse.move(x + (dx * i) / 10, y + (dy * i) / 10)
  await page.mouse.up()
}

/** Chạm đúng vào thiệp / túi vé trong tập hồ sơ (toạ độ từ hình chiếu 3D). */
export async function tapFolder(page: Page, what: 'card' | 'ticket') {
  const t = await page.evaluate(() => (window as Win).__maleTargets?.())
  expect(t, 'chưa có __maleTargets (thiếu ?qa?)').toBeTruthy()
  await page.mouse.click(t![what].x, t![what].y)
}

/** Vùng NHỎ luôn chuyển động/đổi theo giờ → che (tô hồng) khi so ảnh. Lớp phủ toàn màn thì ẩn bằng screenshot.css. */
export const volatile = (page: Page) => [
  page.locator('.inv__map'),
  page.locator('.inv__digits'),
  page.locator('.inv__cap3d'),
  page.locator('.sta__phone'),
]

/** Chụp và so với ảnh gốc. */
export async function snap(page: Page, name: string) {
  await page.waitForTimeout(400)
  await expect(page).toHaveScreenshot(`${name}.png`, { mask: volatile(page), stylePath: SHOT_CSS })
}
