import { test, expect } from '@playwright/test'
import { openApp, openPopup, pickPhoto, snap, swipeToAnswer, waitState } from './helpers'

/**
 * Màn cuộc gọi + popup: vuốt nghe máy thật, form, huỷ, điều kiện nút GỬI.
 */
test.describe('Cuộc gọi & popup', () => {
  test('màn cuộc gọi hiện đúng, không lỗi JS', async ({ page }) => {
    const errors = await openApp(page)
    await expect(page.locator('.sta')).toBeVisible()
    await page.waitForTimeout(1500)
    await snap(page, '01-call')
    expect(errors, 'lỗi JavaScript trên trang').toEqual([])
  })

  test('vuốt chưa tới ngưỡng thì bật về, không nghe máy', async ({ page }) => {
    await openApp(page)
    const k = (await page.locator('.sta__knob').boundingBox())!
    await page.mouse.move(k.x + k.width / 2, k.y + k.height / 2)
    await page.mouse.down()
    await page.mouse.move(k.x + k.width / 2 + 60, k.y + k.height / 2, { steps: 6 })
    await page.mouse.up()
    await waitState(page, 'CALL_IDLE')
  })

  test('vuốt hết → popup; chưa có ảnh thì chưa GỬI được; có ảnh → sẵn sàng', async ({ page }) => {
    const errors = await openApp(page)
    await openPopup(page)
    await expect(page.locator('.gp__submit')).not.toHaveClass(/is-ready/)
    await snap(page, '02-popup-empty-photo')
    await pickPhoto(page)
    await snap(page, '03-popup-ready')
    expect(errors).toEqual([])
  })

  test('Hủy bỏ → đóng popup về lại màn cuộc gọi', async ({ page }) => {
    await openApp(page)
    await openPopup(page)
    await page.locator('.gp__cancel').click()
    await waitState(page, 'CALL_IDLE', 10_000)
    // vuốt lại được lần nữa
    await swipeToAnswer(page)
    await waitState(page, 'RSVP_OPEN')
  })
})
