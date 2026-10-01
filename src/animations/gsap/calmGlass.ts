import { gsap } from 'gsap'

/**
 * Trước khi popup biến hình (tan thành hạt / co vào tập tài liệu): gỡ backdrop-filter của MỌI lớp kính trong popup.
 * iPhone phải tính lại lớp làm mờ phía sau ở từng khung hình khi phần tử có backdrop-filter bị
 * co/giãn/che mặt nạ → giật. Kính của popup chỉ mờ rất nhẹ (1–10px) và đang tan đi nên mắt không thấy khác.
 */
export function calmGlass(popup: HTMLElement) {
  const all = [popup, ...popup.querySelectorAll<HTMLElement>('*')].filter((el) => {
    const cs = getComputedStyle(el)
    return (cs.backdropFilter && cs.backdropFilter !== 'none') || ((cs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter ?? 'none') !== 'none'
  })
  if (all.length) gsap.set(all, { backdropFilter: 'none', webkitBackdropFilter: 'none' })
}
