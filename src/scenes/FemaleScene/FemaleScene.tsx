import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { animate } from 'animejs'
import { COPY } from '../../config/copy'
import { sendExperience, useExperience } from '../../state/experienceMachine'
import { guestAddress, useGuest } from '../../state/guestStore'
import { envelopePress, femaleIdle, femaleTransitionTimeline } from '../../animations/gsap/femaleTransitionTimeline'
import { ENVELOPE_SPOT, FEMALE_IMG, PLACE, pct } from './femaleAssets'
import './FemaleScene.css'

export { preloadFemaleAssets } from './femaleAssets'

const QA = new URLSearchParams(location.search).has('qa')

type Props = {
  popup: React.RefObject<HTMLDivElement | null>
  /** nền cảnh cuộc gọi (ảnh + lớp tối) — "cảnh A" bị đẩy sang phải */
  sceneA: () => HTMLElement[]
}

/** Mặt chữ của lá thư (dùng cho cả thư tự do lẫn thư trong phong bì — cùng một lá). */
function LetterFace({ to }: { to: string }) {
  return (
    <div className="fem-letter__face">
      <p className="fem-letter__title">{COPY.female.letterTitle}</p>
      <p className="fem-letter__to">
        {COPY.female.letterTo} <span>{to}</span>
      </p>
      <p className="fem-letter__date">{COPY.female.letterDate}</p>
    </div>
  )
}

/**
 * NHÁNH NỮ (Phase 8, bước 1): popup → thư → phong bì → cảnh trượt → cảnh tulip → chờ chạm.
 * Phong bì là 1 vật duy nhất đi xuyên 2 cảnh (không có phong bì thứ hai trong ảnh nền).
 */
export default function FemaleScene({ popup, sceneA }: Props) {
  const guest = useGuest((s) => s.guest)
  const state = useExperience((s) => s.state)
  const to = guest ? guestAddress(guest) : ''

  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const idle = useRef<gsap.core.Timeline | null>(null)

  // chạy 1 lần khi vào nhánh Nữ
  useLayoutEffect(() => {
    const el = root.current!
    const q = <T extends HTMLElement = HTMLElement>(s: string) => el.querySelector<T>(s)!
    const refs = {
      stage: el,
      popup: popup.current,
      sceneA: sceneA(),
      sceneB: q('.fem__b'),
      letter: q('.fem__letter'),
      env: q('.fem__env'),
      envFloat: q('.fem__env-float'),
      envShadow: q('.fem__env-shadow'),
      envLetter: q('.fem__env-letter'),
      flap: q('.fem__flap'),
      seal: q('.fem__seal'),
      spot: q('.fem__spot'),
      bouquet: q('.fem__bouquet'),
      choc: q('.fem__choc'),
      petals: [...el.querySelectorAll<HTMLElement>('.fem__petal')],
      light: q('.fem__light'),
      cta: q('.fem__cta'),
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // gsap.context: khi gỡ (kể cả StrictMode chạy effect 2 lần ở dev) trả MỌI thứ về như cũ —
    // nền cảnh cuộc gọi, khung popup, phong bì… → lần đo sau không bị lệch vì transform còn sót
    const ctx = gsap.context(() => {
      tl.current = femaleTransitionTimeline(refs, (step) => {
        sendExperience('DONE') // mỗi mốc: đi tiếp đúng 1 bước trong state machine
        if (step === 'waiting' && !reduce) ctx.add(() => { idle.current = femaleIdle(refs) })
      })
      if (reduce) tl.current.timeScale(2.2)
    })
    if (QA) (window as unknown as { __femaleTl: unknown }).__femaleTl = tl.current
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // chữ mời chạm "thở" nhẹ (Anime.js — chỉ opacity của chữ con; khối nút do GSAP giữ)
  useEffect(() => {
    if (state !== 'FEMALE_WAITING_TAP' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const a = animate(root.current!.querySelector('.fem__cta span')!, { opacity: [1, 0.5], duration: 1500, ease: 'inOutSine', loop: true, alternate: true })
    return () => { a.revert() }
  }, [state])

  const onTapEnvelope = () => {
    if (useExperience.getState().state !== 'FEMALE_WAITING_TAP') return
    envelopePress(root.current!.querySelector<HTMLElement>('.fem__env-float')!)
    // Bước tiếp theo (mở phong bì → vé ra trước → thư → Z-fold) làm ở phần sau.
  }

  return (
    <div className="fem" data-scene="female" ref={root}>
      {/* CẢNH B: tĩnh vật tulip (các vật tách lớp để vào lần lượt) */}
      <div className="fem__b" aria-hidden>
        <div className="fem__plate">
          <img className="fem__bg" src={FEMALE_IMG.sceneBg} alt="" />
          <img className="fem__obj fem__choc" src={FEMALE_IMG.choc} alt="" style={pct(PLACE.choc)} />
          <img className="fem__obj fem__petal" src={FEMALE_IMG.petal1} alt="" style={pct(PLACE.petal1)} />
          <img className="fem__obj fem__petal" src={FEMALE_IMG.petal2} alt="" style={pct(PLACE.petal2)} />
          <img className="fem__obj fem__petal" src={FEMALE_IMG.petal3} alt="" style={pct(PLACE.petal3)} />
          <img className="fem__obj fem__bouquet" src={FEMALE_IMG.bouquet} alt="" style={pct(PLACE.bouquet)} />
          <div className="fem__spot" style={pct(ENVELOPE_SPOT)} />
          <div className="fem__light" />
        </div>
      </div>

      {/* PHONG BÌ — thân sau · lá thư · thân trước · nắp (2 mặt) */}
      <div className="fem__env" onClick={onTapEnvelope} role="button" aria-label={COPY.female.cta}
        aria-disabled={state !== 'FEMALE_WAITING_TAP'}>
        <div className="fem__env-float">
          <div className="fem__env-shadow" />
          <img className="fem__env-back" src={FEMALE_IMG.envBack} alt="" />
          <div className="fem__env-letter fem-letter">
            <LetterFace to={to} />
          </div>
          <img className="fem__env-front" src={FEMALE_IMG.envFront} alt="" />
          <div className="fem__flap">
            <img className="fem__flap-in" src={FEMALE_IMG.flapIn} alt="" />
            <div className="fem__flap-out">
              <img src={FEMALE_IMG.flapOut} alt="" />
              <img className="fem__seal" src={FEMALE_IMG.seal} alt="" />
            </div>
          </div>
        </div>
      </div>

      {/* LÁ THƯ tự do: sinh ra đúng chỗ popup, bay tới miệng phong bì rồi trao vai cho thư bên trong */}
      <div className="fem__letter fem-letter" aria-hidden>
        <LetterFace to={to} />
      </div>

      <button type="button" className="fem__cta" onClick={onTapEnvelope} disabled={state !== 'FEMALE_WAITING_TAP'}>
        <span>{COPY.female.cta}</span>
      </button>
    </div>
  )
}
