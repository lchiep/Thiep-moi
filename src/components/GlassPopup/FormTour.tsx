import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { COPY } from '../../config/copy'

/**
 * Popup vừa mở: 1 lời nhắn → hướng dẫn TỪNG Ô (kiểu coach-mark: làm tối xung quanh,
 * khoét sáng đúng ô đang nói, thẻ giải thích bên cạnh, "k / N", Quay lại · Tiếp theo)
 * → xong mới dùng form chính. Bỏ qua: tap 2 lần (lời chào: ở đâu cũng được; thẻ: tap vào thẻ) hoặc chạm thẳng vào ô trong form.
 * GSAP giữ vị trí khung sáng / thẻ / cuộn form; React chỉ giữ bước hiện tại.
 */
const PAD = 6 // khung sáng rộng hơn ô một chút

type Props = {
  delay: number
  onDone: () => void
  /** chế độ "nhắc ô còn thiếu": chỉ đi qua các ô này, không có lời nhắn chào */
  only?: string[]
}

export default function FormTour({ delay, onDone, only }: Props) {
  const C = COPY.rsvpIntro
  const steps = only ? C.tour.filter((t) => only.includes(t.key)) : C.tour
  const N = steps.length
  const [step, setStep] = useState(only ? 0 : -1) // -1 = lời nhắn chào
  const root = useRef<HTMLDivElement>(null)
  const welcome = useRef<HTMLDivElement>(null)
  const hole = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const ready = useRef(false)
  const lastTap = useRef(0)

  // lời nhắn chào xuất hiện sau khi popup nở xong
  useEffect(() => {
    if (only) {
      gsap.set(root.current, { autoAlpha: 1 })
      return
    }
    const tl = gsap
      .timeline({ delay, onComplete: () => { ready.current = true } })
      .fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' })
      .fromTo(welcome.current, { autoAlpha: 0, y: 16, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)' }, '<0.05')
    return () => { tl.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay])

  const finish = () => {
    ready.current = false
    gsap.to(root.current, { autoAlpha: 0, duration: 0.35, ease: 'power1.out', onComplete: onDone })
  }

  // tap 2 lần (≤300ms) → bỏ qua hết. Lời chào: tap ở bất kỳ đâu; thẻ hướng dẫn: tap vào thẻ (không tính nút)
  const onWelcomeTap = () => {
    if (step >= 0 || !ready.current) return
    const now = performance.now()
    if (now - lastTap.current < 300) finish()
    lastTap.current = now
  }
  const onTipTap = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const now = performance.now()
    if (now - lastTap.current < 300) finish()
    lastTap.current = now
  }

  const startTour = () => {
    if (!ready.current) return
    ready.current = false
    gsap.to(welcome.current, {
      autoAlpha: 0, y: -10, scale: 0.96, duration: 0.3, ease: 'power2.in',
      onComplete: () => setStep(0),
    })
  }
  const go = (i: number) => {
    if (i >= N) return finish()
    if (i < 0) return
    setStep(i)
  }

  // mỗi bước: cuộn form cho ô vào tầm nhìn → dời khung sáng + thẻ tới ô đó
  useLayoutEffect(() => {
    if (step < 0) return
    const gp = root.current!.parentElement!
    const scroller = gp.querySelector<HTMLElement>('.gp__scroll')!
    const field = gp.querySelector<HTMLElement>(`[data-tour="${steps[step].key}"]`)
    if (!field) return
    ready.current = false
    const sRect = scroller.getBoundingClientRect()
    const fRect = field.getBoundingClientRect()
    const target = Math.max(
      0,
      Math.min(scroller.scrollTop + (fRect.top - sRect.top) - sRect.height * 0.28, scroller.scrollHeight - sRect.height),
    )
    const first = step === 0 && hole.current!.style.opacity === ''
    const tl = gsap.timeline({ onComplete: () => { ready.current = true } })
    tl.to(scroller, { scrollTop: target, duration: first ? 0.2 : 0.45, ease: 'power2.inOut' })
      .add(() => {
        const g = gp.getBoundingClientRect()
        const r = field.getBoundingClientRect()
        const box = { x: r.left - g.left - PAD, y: r.top - g.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 }
        // thẻ: dưới ô nếu đủ chỗ, không thì phía trên
        const tipH = tip.current!.offsetHeight
        const below = box.y + box.h + 14 + tipH < g.height - 12
        const ty = below ? box.y + box.h + 14 : box.y - 14 - tipH
        const move = first ? gsap.set : (t: gsap.TweenTarget, v: gsap.TweenVars) => gsap.to(t, { ...v, duration: 0.45, ease: 'power3.inOut' })
        move(hole.current, { x: box.x, y: box.y, width: box.w, height: box.h })
        move(tip.current, { y: Math.max(12, ty) })
        gsap.set(tip.current, { attr: { 'data-side': below ? 'below' : 'above' } })
        if (first) {
          gsap.fromTo(hole.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 })
          gsap.fromTo(tip.current, { autoAlpha: 0, scale: 0.95 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)' })
        }
      })
      .to({}, { duration: first ? 0.4 : 0.45 })
    return () => { tl.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // đang hướng dẫn từng ô: khách chạm thẳng vào form (ô muốn nhập) → tắt hướng dẫn luôn,
  // chạm đó vẫn đi xuống ô (lớp tối không chặn), khách gõ được ngay
  useEffect(() => {
    if (step < 0) return
    const gp = root.current!.parentElement!
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('.gpt__tip')) return
      if (el.closest('.gp__card')) finish()
    }
    gp.addEventListener('pointerdown', onDown, true)
    return () => gp.removeEventListener('pointerdown', onDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step >= 0])

  const t = step >= 0 ? steps[step] : null
  const last = step === N - 1
  return (
    <div className={`gpt ${step >= 0 ? 'is-touring' : ''}`} ref={root} onPointerUp={onWelcomeTap} role="dialog" aria-modal="true" aria-label="Hướng dẫn điền thông tin">
      <div className="gpt__dim" />

      {step < 0 && (
        <div className="gpt__welcome" ref={welcome}>
          {C.welcome.map((line, i) => <p key={i} className={i === 0 ? 'gpt__lead' : 'gpt__body'}>{line}</p>)}
          <button type="button" className="gpt__btn is-primary" onClick={startTour}>{C.start}</button>
          <p className="gpt__skip">{C.skipHint}</p>
        </div>
      )}

      {/* khung sáng khoét quanh ô đang hướng dẫn (bóng đổ khổng lồ = vùng tối) */}
      <div className="gpt__hole" ref={hole} aria-hidden hidden={step < 0} />

      <div className="gpt__tip" ref={tip} hidden={step < 0} aria-live="polite" onPointerUp={onTipTap}>
        {t && (
          <>
            <span className="gpt__skiptag">{C.skipHint}</span>
            <p className="gpt__title">{t.title}</p>
            <p className="gpt__text">{t.body}</p>
            <div className="gpt__row">
              <span className="gpt__count">{step + 1} / {N}</span>
              {last ? (
                // ô cuối: không có "Bắt đầu điền" — chạm vào ô để điền, hoặc quay lại
                <button type="button" className="gpt__btn" disabled={step === 0} onClick={() => go(step - 1)}>← {C.back}</button>
              ) : (
                <>
                  <button type="button" className="gpt__btn" disabled={step === 0} onClick={() => go(step - 1)}>{C.back}</button>
                  <button type="button" className="gpt__btn is-primary" onClick={() => go(step + 1)}>{C.next}</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
