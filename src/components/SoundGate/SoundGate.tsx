import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { animate } from 'animejs'
import './SoundGate.css'

/**
 * Màn chờ TRƯỚC cuộc gọi. Trình duyệt chỉ cho phát tiếng sau khi khách chạm vào trang (không lách được bằng code),
 * nên khách chạm 1 lần ở đây → chuông reo ngay và màn cuộc gọi hiện ra.
 *  - GSAP: mờ dần + tan ra khi chạm. Anime.js: nhịp thở chữ gợi ý.
 *  - Bỏ qua khi có ?qa hoặc ?nogate (test tự động / xem nhanh).
 */
const TEXT = { title: 'Graduation Gala', hint: 'Chạm để nhận cuộc gọi', aria: 'Chạm để bắt đầu và bật nhạc' }
const SKIP = (() => {
  const q = new URLSearchParams(location.search)
  return q.has('qa') || q.has('nogate')
})()

export default function SoundGate() {
  const [open, setOpen] = useState(!SKIP)
  const root = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLParagraphElement>(null)
  const done = useRef(false)

  useLayoutEffect(() => {
    if (!open) return
    const a = hint.current ? animate(hint.current, { opacity: [0.45, 1], duration: 1400, ease: 'inOutSine', loop: true, alternate: true }) : null
    return () => { a?.revert() }
  }, [open])

  const onTap = useCallback(() => {
    if (done.current || !root.current) return
    done.current = true
    // cú chạm này đồng thời mở khoá âm thanh (audioManager nghe pointerup/click ở window)
    gsap.to(root.current, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut', onComplete: () => setOpen(false) })
  }, [])

  if (!open) return null
  return (
    <div className="gate" ref={root} data-scene="gate" role="button" tabIndex={0} aria-label={TEXT.aria} onClick={onTap} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTap() }}>
      <p className="gate__title">{TEXT.title}</p>
      <p className="gate__hint" ref={hint}>{TEXT.hint}</p>
    </div>
  )
}
