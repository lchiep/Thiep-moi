import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { ICamera } from './formIcons'
import { EASE } from '../../animations/motion'
import { COPY } from '../../config/copy'

/**
 * Ô "Ảnh của bạn" — khu ảnh lớn lấp phần trống cuối form.
 *  - Chưa có ảnh: cả khu là vùng chạm để chọn ảnh.
 *  - Có ảnh: [nút camera = chọn lại] + [ảnh chân dung — chạm để xem to].
 * Xem to: ảnh bay từ đúng chỗ ảnh nhỏ ra giữa màn (FLIP, GSAP), chạm lần nữa để thu về.
 */
type Props = {
  url: string
  onPick: (file: File | null) => void
}

export default function PhotoPicker({ url, onPick }: Props) {
  const C = COPY.rsvpIntro.photo
  const thumb = useRef<HTMLButtonElement>(null)
  const [host, setHost] = useState<HTMLElement | null>(null) // có giá trị = đang xem to
  const [tipFor, setTipFor] = useState('') // url ảnh vừa up → hiện bong bóng chú thích cho ảnh đó
  useEffect(() => { if (url) setTipFor(url) }, [url])

  const input = (
    <input type="file" accept="image/*" onChange={(e) => { onPick(e.target.files?.[0] ?? null); e.target.value = '' }} />
  )

  return (
    <div className={`gp__input gp__photozone ${url ? 'has-photo' : ''}`}>
      {url ? (
        <>
          <label className="gp__recam" aria-label={C.repick}>
            <ICamera />
            {input}
            {/* bong bóng chú thích kiểu tin nhắn: hiện mỗi lần vừa up ảnh, vài giây rồi tự ẩn (CSS keyframe) */}
            {tipFor === url && (
              <span className="gp__bubble" role="status" onAnimationEnd={(e) => { if (e.animationName === 'gp-bubble') setTipFor('') }}>
                {C.viewHint}
              </span>
            )}
          </label>
          <button type="button" ref={thumb} className="gp__thumb" aria-label={C.view}
            onClick={() => setHost(thumb.current?.closest('.gp') as HTMLElement | null)}>
            <img src={url} alt="Ảnh bạn vừa chọn" />
          </button>
        </>
      ) : (
        <label className="gp__photo-empty">
          <ICamera />
          <span className="gp__photo-text">{C.empty}</span>
          {input}
        </label>
      )}
      {host && url && thumb.current &&
        createPortal(<Lightbox url={url} from={thumb.current} onClose={() => setHost(null)} />, host)}
    </div>
  )
}

function Lightbox({ url, from, onClose }: { url: string; from: HTMLElement; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    const a = from.getBoundingClientRect()
    const b = img.current!.getBoundingClientRect()
    // FLIP: đặt ảnh to trùng ảnh nhỏ rồi bay ra vị trí thật
    const dx = a.left + a.width / 2 - (b.left + b.width / 2)
    const dy = a.top + a.height / 2 - (b.top + b.height / 2)
    const s = Math.max(a.width / b.width, a.height / b.height)
    from.style.visibility = 'hidden'
    tl.current = gsap
      .timeline({ onReverseComplete: onClose })
      .fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0)
      .fromTo(img.current, { x: dx, y: dy, scale: s, borderRadius: 8 },
        { x: 0, y: 0, scale: 1, borderRadius: 14, duration: 0.55, ease: EASE.paper }, 0)
    return () => {
      tl.current?.kill()
      from.style.visibility = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = () => {
    const t = tl.current
    if (!t || t.reversed()) return
    t.timeScale(1.25).reverse()
  }

  return (
    <div className="gp__lightbox" ref={root} onClick={close} role="dialog" aria-label="Xem ảnh">
      <img ref={img} src={url} alt="Ảnh của bạn" />
      <span className="gp__lightbox-hint">{COPY.rsvpIntro.photo.close}</span>
    </div>
  )
}
