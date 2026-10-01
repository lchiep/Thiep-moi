import { test, expect } from '@playwright/test'
import { openApp, openPopup, pickPhoto, snap, swipeOn, tapFolder, waitState } from './helpers'

/**
 * Nhánh Nam từ đầu tới thiệp, kèm các lỗi cũ đã từng gặp (regression):
 *  - vé "trôi dần lên" sau mỗi lần cất vé / Quay lại → so cùng 1 ảnh gốc '10-folder-open' 3 lần
 *  - chạm thiệp → vào thẳng thiệp; chạm vé → rút vé; xem vé chỉ vuốt xuống để cất (không vuốt phải sang thiệp)
 */
test('nhánh Nam: tập hồ sơ → vé → cất vé → thiệp → quay lại', async ({ page }) => {
  test.slow() // 3D chạy bằng phần mềm, lâu hơn máy thật
  const errors = await openApp(page)
  await openPopup(page)
  await pickPhoto(page)
  await page.locator('.gp__submit').click()

  // popup hoá thành tập tài liệu → mở bìa → chờ chạm
  await waitState(page, 'MALE_WAITING_TAP', 90_000)
  await snap(page, '10-folder-open')

  // chạm vào túi vé → rút vé → xem vé
  await tapFolder(page, 'ticket')
  await waitState(page, 'TICKET_VIEW', 30_000)
  await snap(page, '11-ticket-view')

  // vuốt xuống → cất vé → tập hồ sơ y như lúc đầu
  await swipeOn(page, page.locator('.male__cta'), 0, 160)
  await waitState(page, 'MALE_WAITING_TAP', 30_000)
  await snap(page, '10-folder-open')

  // xem vé chỉ cất được bằng vuốt xuống (vuốt phải KHÔNG sang thiệp nữa) → chạm thiệp để vào thiệp
  await tapFolder(page, 'ticket')
  await waitState(page, 'TICKET_VIEW', 30_000)
  await swipeOn(page, page.locator('.male__cta'), 180, 0)
  await page.waitForTimeout(600)
  await expect(page.locator('html')).toHaveAttribute('data-exp', 'TICKET_VIEW')
  await swipeOn(page, page.locator('.male__cta'), 0, 160)
  await waitState(page, 'MALE_WAITING_TAP', 30_000)
  await tapFolder(page, 'card')
  await waitState(page, 'INVITATION_VIEW', 60_000)
  await snap(page, '20-invite-p1')

  // 5 trang nội dung: cuộn từng trang (scroll-snap) rồi chụp
  const scroller = page.locator('.inv__scroll')
  const pages = await page.locator('.inv__sec').count()
  expect(pages).toBe(5)
  for (let i = 1; i < pages; i++) {
    await scroller.evaluate((el, n) => el.scrollTo({ top: n * el.clientHeight, behavior: 'instant' as ScrollBehavior }), i)
    await page.waitForTimeout(700)
    await snap(page, `2${i + 1}-invite-p${i + 1}`)
  }

  // ← Quay lại → về tập hồ sơ, vé vẫn nằm đúng chỗ cũ
  await page.locator('.inv__back').click()
  await waitState(page, 'MALE_WAITING_TAP', 60_000)
  await snap(page, '10-folder-open')

  // chạm thẳng vào thiệp → vào thiệp (không qua vé)
  await tapFolder(page, 'card')
  await waitState(page, 'INVITATION_VIEW', 60_000)

  expect(errors, 'lỗi JavaScript trên trang').toEqual([])
})

test('bản đồ: kéo được, nút ◎ đưa về trường', async ({ page }) => {
  test.slow()
  await openApp(page)
  await openPopup(page)
  await pickPhoto(page)
  await page.locator('.gp__submit').click()
  await waitState(page, 'MALE_WAITING_TAP', 90_000)
  await tapFolder(page, 'card')
  await waitState(page, 'INVITATION_VIEW', 60_000)

  const map = page.locator('.inv__map')
  await map.scrollIntoViewIfNeeded()
  await expect(map.locator('.leaflet-marker-icon')).toBeVisible({ timeout: 15_000 })
  const pin = map.locator('.inv__pin')
  // vị trí ghim TƯƠNG ĐỐI với khung bản đồ (trang có thể xê dịch do scroll-snap)
  const rel = async () => {
    const m = (await map.boundingBox())!, p = (await pin.boundingBox())!
    return { x: p.x - m.x, y: p.y - m.y }
  }
  const before = await rel()
  await swipeOn(page, map, -90, -40)
  await page.waitForTimeout(1500) // chờ quán tính dừng (Leaflet bỏ qua cú chạm ngay sau khi kéo)
  const after = await rel()
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y), 'kéo bản đồ thì ghim phải dịch theo').toBeGreaterThan(40)

  // ◎ → bản đồ bay về: đầu nhọn ghim (giữa-đáy) trùng tâm khung bản đồ
  const home = map.locator('.inv__home a')
  await home.click()
  await expect(async () => {
    if ((await rel()).x < before.x - 30) await home.click() // cú chạm đầu bị nuốt → chạm lại
    await page.waitForTimeout(1200)
    const m = (await map.boundingBox())!, p = (await pin.boundingBox())!
    expect(Math.abs(p.x + p.width / 2 - (m.x + m.width / 2)), 'nút ◎ phải đưa trường về giữa bản đồ').toBeLessThan(8)
    expect(Math.abs(p.y + p.height - (m.y + m.height / 2))).toBeLessThan(8)
  }).toPass({ timeout: 15_000 })
})
