import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import type { RsvpNote as Note } from '../../config/rsvpNote'
import './RsvpNote.css'

/**
 * Tờ giấy nhắn nhỏ (giấy trắng kem + kẹp giấy đỏ đô, có xấp giấy lót phía sau) hiện lên trên màn thiệp.
 *  - Gắn vào khung điện thoại (.app__phone) bằng portal để không bị các trang cuộn (đang scale) làm lệch.
 *  - GSAP giữ mọi chuyển động: nền mờ dần · tờ giấy rơi xuống + xoay nhẹ · kẹp giấy kẹp vào sau.
 *  - Đóng: chạm nút hoặc chạm ngoài tờ giấy → tờ giấy trượt xuống nhẹ + mờ, rồi mới gỡ khỏi DOM.
 */
export default function RsvpNote({ note, onClose }: { note: Note; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLDivElement>(null)
  const clip = useRef<SVGSVGElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const closing = useRef(false)
  const host = document.querySelector<HTMLElement>('.app__phone') ?? document.body

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (reduce) { gsap.set(root.current, { autoAlpha: 1 }); gsap.set(paper.current, { rotation: -1.2 }); return }
      tl.current = gsap
        .timeline()
        .fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0)
        .fromTo(paper.current, { y: 46, rotation: -6, scale: 0.94, autoAlpha: 0 }, { y: 0, rotation: -1.2, scale: 1, autoAlpha: 1, duration: 0.75, ease: 'power3.out' }, 0.05)
        .fromTo(clip.current, { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.6)' }, 0.5)
    }, root)
    return () => ctx.revert()
  }, [])

  const close = () => {
    if (closing.current) return
    closing.current = true
    tl.current?.kill()
    gsap
      .timeline({ onComplete: onClose })
      .to(paper.current, { y: 30, rotation: 2, scale: 0.97, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0)
      .to(root.current, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0.05)
  }

  return createPortal(
    <div className="note" ref={root} role="dialog" aria-modal="true" aria-label="Lời nhắn nhỏ" onClick={close}>
      <div className="note__paper" ref={paper} onClick={(e) => e.stopPropagation()}>
        <svg className="note__clip" ref={clip} viewBox="0 0 28 70" aria-hidden="true">
          <path d="M6 22V58a8 8 0 0 0 16 0V16a5.5 5.5 0 0 0-11 0V54a2.5 2.5 0 0 0 5 0V24" fill="none" stroke="#7a2230" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="note__text">
          {note.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <button type="button" className="note__btn" onClick={close}>{note.button}</button>
      </div>
    </div>,
    host,
  )
}
