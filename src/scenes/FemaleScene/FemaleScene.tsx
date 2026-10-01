import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { animate } from 'animejs'
import { COPY } from '../../config/copy'
import { sendExperience, useExperience } from '../../state/experienceMachine'
import { femaleIdle, femaleTransitionTimeline } from '../../animations/gsap/femaleTransitionTimeline'
import { femaleOpenTimeline } from '../../animations/gsap/femaleOpenTimeline'
import { deckRevealTimeline, deckShuffleTimeline, deckToInvitationTimeline, type DeckRefs } from '../../animations/gsap/femaleDeckTimeline'
import InvitationScene from '../InvitationScene/InvitationScene'
import { guestAddress, useGuest } from '../../state/guestStore'
import { sealSparkle } from '../../animations/anime/microInteractions'
import { ENVELOPE_SPOT, FEMALE_IMG, PLACE, SCATTER, getCards, pct } from './femaleAssets'
import './FemaleScene.css'

export { preloadFemaleAssets, buildCards } from './femaleAssets'

const QA = new URLSearchParams(location.search).has('qa')

type Props = {
  popup: React.RefObject<HTMLDivElement | null>
  /** nền cảnh cuộc gọi (ảnh + lớp tối) — "cảnh A" bị đẩy sang phải */
  sceneA: () => HTMLElement[]
}


/** Cánh hoa bay trong cơn gió chuyển cảnh: vị trí/cỡ/độ nhoè ngẫu nhiên nhưng CỐ ĐỊNH (seed) → lần nào cũng đẹp như nhau. */
const FLURRY = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x) }
  return { src: [FEMALE_IMG.petal1, FEMALE_IMG.petal2, FEMALE_IMG.petal3][i % 3], top: r(1) * 100, size: 9 + r(2) * 13, depth: r(3) }
})

/**
 * NHÁNH NỮ (Phase 8, bước 1): popup tan thành hạt sáng bay vào phong bì → nắp đóng → cơn gió cánh hoa
 * cuốn cảnh cũ đi → bàn tĩnh vật tulip (bày sẵn) → phong bì đáp xuống dưới bó hoa → chờ chạm.
 * Phong bì là 1 vật duy nhất đi xuyên 2 cảnh (không có phong bì thứ hai trong ảnh nền).
 */
export default function FemaleScene({ popup, sceneA }: Props) {
  const state = useExperience((s) => s.state)

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
      sceneB: [...el.querySelectorAll<HTMLElement>('.fem__b .fem__plate')],
      frontPlate: q('.fem__b--front'),
      edge: q('.fem__edge'),
      flurry: [...el.querySelectorAll<HTMLElement>('.fem__flurry img')],
      sparks: q<HTMLCanvasElement>('.fem__sparks'),
      envGlow: q('.fem__env-glow'),
      envSun: q('.fem__env-sun'),
      plateRef: q('.fem__b .fem__plate'),
      onSeal: () => { cleanSpark = sealSparkle([...el.querySelectorAll<HTMLElement>('.fem__seal-fx i')]) },
      env: q('.fem__env'),
      envFloat: q('.fem__env-float'),
      envShadow: q('.fem__env-shadow'),
      envLetter: q('.fem__env-letter'),
      flap: q('.fem__flap'),
      envClosed: q('.fem__env-closed'),
      envInner: [...el.querySelectorAll<HTMLElement>('.fem__env-back, .fem__env-front, .fem__env-letter, .fem__env-glow')],
      spot: q('.fem__spot'),
      bouquet: q('.fem__bq'),
      choc: q('.fem__choc'),
      petals: [...el.querySelectorAll<HTMLElement>('.fem__petal')],
      light: q('.fem__light'),
      cta: q('.fem__cta'),
    }
    let cleanSpark: (() => void) | null = null
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
    return () => { ctx.revert(); cleanSpark?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // chữ mời chạm "thở" nhẹ (Anime.js — chỉ opacity của chữ con; khối nút do GSAP giữ)
  useEffect(() => {
    if (state !== 'FEMALE_WAITING_TAP' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const a = animate(root.current!.querySelector('.fem__cta span')!, { opacity: [1, 0.5], duration: 1500, ease: 'inOutSine', loop: true, alternate: true })
    return () => { a.revert() }
  }, [state])

  // CHẠM THƯ → phong bì được nhấc lên, bay ra giữa màn → mở nắp → vé ra trước → thiệp ra sau
  const openCtx = useRef<gsap.Context | null>(null)
  useEffect(() => () => { openCtx.current?.revert() }, []) // chỉ dọn khi rời cảnh (không dọn lúc đổi state)
  useLayoutEffect(() => {
    if (state !== 'FEMALE_ENVELOPE_OPEN' || openCtx.current) return
    const el = root.current!
    const q = (s: string) => el.querySelector<HTMLElement>(s)!
    idle.current?.kill() // thôi "thở" — từ giờ GSAP mở phong bì giữ các thuộc tính này
    openCtx.current = gsap.context(() => {
      const t = femaleOpenTimeline({
        stage: el, env: q('.fem__env'), envFloat: q('.fem__env-float'), envShadow: q('.fem__env-shadow'),
        envSun: q('.fem__env-sun'), envClosed: q('.fem__env-closed'), pocket: q('.fem__env-pocket'),
        inner: [...el.querySelectorAll<HTMLElement>('.fem__env-back, .fem__env-front, .fem__env-letter, .fem__env-glow')],
        wall: q('.fem__env-wall'), flap: q('.fem__flap'), ticket: q('.fem__card-ticket'), letter: q('.fem__card-letter'),
        cta: q('.fem__cta'),
      }, () => sendExperience('DONE')) // → FEMALE_CARDS_READY
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) t.timeScale(2)
      if (QA) (window as unknown as { __femaleOpenTl: unknown }).__femaleOpenTl = t
    })
  }, [state])

  // ---------- VÉ + THƯ ra khỏi phong bì, đảo bài, cất lại ----------
  const deckTl = useRef<gsap.core.Timeline | null>(null)
  const revealTl = useRef<gsap.core.Timeline | null>(null)
  const front = useRef<'ticket' | 'letter'>('ticket')
  const inv = useRef<HTMLDivElement>(null)
  const invTl = useRef<gsap.core.Timeline | null>(null)
  const guest = useGuest((g) => g.guest)
  const deckRefs = (): DeckRefs => {
    const el = root.current!
    const q = (s: string) => el.querySelector<HTMLElement>(s)!
    return { stage: el, env: q('.fem__env'), ticketIn: q('.fem__card-ticket'), letterIn: q('.fem__card-letter'),
      ticket: q('.fem__deck-ticket'), letter: q('.fem__deck-letter'), veil: q('.fem__veil') }
  }
  useEffect(() => () => { deckTl.current?.kill(); revealTl.current?.kill(); invTl.current?.kill() }, [])
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const run = (t: gsap.core.Timeline) => {
      deckTl.current = t.eventCallback('onComplete', () => sendExperience('DONE'))
      if (reduce) t.timeScale(2)
      if (QA) (window as unknown as { __femaleDeckTl: unknown }).__femaleDeckTl = t
    }
    if (state === 'FEMALE_TICKET_REVEAL') {
      front.current = 'ticket'
      revealTl.current = deckRevealTimeline(deckRefs())
      run(revealTl.current)
    } else if (state === 'FEMALE_SHUFFLE_TO_LETTER') {
      // đảo bài → thư lên trước → thành màn thiệp (như nhánh Nam)
      front.current = 'letter'
      invTl.current = deckToInvitationTimeline(deckRefs(), inv.current!)
      run(invTl.current)
    } else if (state === 'FEMALE_SHUFFLE_TO_TICKET') {
      // "← Quay lại": tua ngược đúng đường đã vào màn thiệp
      front.current = 'ticket'
      const m = invTl.current
      run(m ? m.pause().tweenFromTo(m.duration(), 0, { duration: m.duration() * 0.75, ease: 'power1.inOut' }) as unknown as gsap.core.Timeline
        : deckShuffleTimeline(deckRefs(), false))
    } else if (state === 'FEMALE_CARDS_STOW' && revealTl.current) {
      // thư đang trước → đảo lại cho vé lên trước, rồi tua ngược đúng đường đã rút ra
      const t = gsap.timeline()
      if (front.current === 'letter') t.add(deckShuffleTimeline(deckRefs(), false))
      const r = revealTl.current.pause()
      t.add(r.tweenFromTo(r.duration(), 0, { duration: r.duration() * 0.8, ease: 'power1.inOut' }))
      front.current = 'ticket'
      run(t)
    }
  }, [state])

  // chạm = TAP · vuốt lên = SWIPE · vuốt xuống = SWIPE_DOWN (chỉ nhận khi đang chờ)
  const deckActive = state === 'FEMALE_CARDS_READY' || state === 'FEMALE_TICKET_VIEW'
  const touch = useRef({ x: 0, y: 0 })
  const onDeckDown = (e: React.PointerEvent) => { touch.current = { x: e.clientX, y: e.clientY } }
  const onDeckUp = (e: React.PointerEvent) => {
    const dx = e.clientX - touch.current.x
    const dy = e.clientY - touch.current.y
    const dist = Math.hypot(dx, dy)
    if (dist < 12) sendExperience('TAP')
    // đang xem vé: vuốt NGANG hay DỌC (hướng nào cũng được) → sang thư (Hiệp)
    else if (useExperience.getState().state === 'FEMALE_TICKET_VIEW') { if (dist > 40) sendExperience('SWIPE') }
    // phong bì mở: vuốt lên → rút vé
    else if (dy < -40 && Math.abs(dy) > Math.abs(dx) * 1.2) sendExperience('SWIPE')
  }
  const hint =
    state === 'FEMALE_CARDS_READY' ? COPY.female.cardsHint
      : state === 'FEMALE_TICKET_VIEW' ? COPY.female.ticketHint : ''
  const viewing = state === 'FEMALE_TICKET_VIEW'
  const invMounted = state === 'FEMALE_TICKET_VIEW' || state === 'FEMALE_SHUFFLE_TO_LETTER' || state === 'FEMALE_LETTER_VIEW' || state === 'FEMALE_SHUFFLE_TO_TICKET'

  const onTapEnvelope = () => {
    if (useExperience.getState().state !== 'FEMALE_WAITING_TAP') return
    sendExperience('TAP') // → FEMALE_ENVELOPE_OPEN
  }
  const cards = getCards()

  return (
    <div className="fem" data-scene="female" ref={root}>
      {/* CẢNH B (lớp sau): nền lụa + đá, KitKat, cánh hoa — nằm DƯỚI nền cuộc gọi cho tới khi trang lật */}
      <div className="fem__b" aria-hidden>
        <div className="fem__plate">
          <img className="fem__bg" src={FEMALE_IMG.sceneBg} alt="" />
          <img className="fem__obj fem__choc" src={FEMALE_IMG.choc} alt="" style={pct(PLACE.choc)} />
          <img className="fem__obj fem__petal" src={FEMALE_IMG.petal1} alt="" style={pct(PLACE.petal1)} />
          <img className="fem__obj fem__petal" src={FEMALE_IMG.petal2} alt="" style={pct(PLACE.petal2)} />
          <img className="fem__obj fem__petal" src={FEMALE_IMG.petal3} alt="" style={pct(PLACE.petal3)} />
          {SCATTER.map(([n, box, rot], i) => (
            <img key={i} className="fem__obj fem__petal" src={FEMALE_IMG[`petal${n}`]} alt=""
              style={{ ...pct(box), transform: `rotate(${rot}deg)` }} />
          ))}
          <div className="fem__spot" style={pct(ENVELOPE_SPOT)} />
        </div>
      </div>

      {/* PHONG BÌ — thân sau · lá thư · thân trước · thân đã đóng (E1) · nắp 2 mặt */}
      <div className="fem__env" onClick={onTapEnvelope} role="button" aria-label={COPY.female.cta}
        aria-disabled={state !== 'FEMALE_WAITING_TAP'}>
        <div className="fem__env-float">
          <div className="fem__env-shadow" />
          <img className="fem__env-back" src={FEMALE_IMG.envBack} alt="" />
          {/* lúc mở phong bì: vách trong · thiệp · vé · túi trước (V) — vé + thiệp nằm sẵn trong túi */}
          <div className="fem__env-wall" />
          {/* thư = cả tờ thiệp dọc: khung cắt chỉ giấu phần thò xuống dưới đáy phong bì (phía trên vẫn ló ra được) */}
          <div className="fem__letter-clip">
            <img className="fem__card fem__card-letter" src={cards.letter} alt="" />
          </div>
          <img className="fem__card fem__card-ticket" src={cards.ticket} alt="" />
          {/* giấy thư "đọng" lại trong túi khi hạt sáng bay vào (chỉ thấy mặt giấy qua miệng túi) */}
          <div className="fem__env-letter fem-letter" />
          <div className="fem__env-glow" />
          <img className="fem__env-front" src={FEMALE_IMG.envFront} alt="" />
          <img className="fem__env-closed" src={FEMALE_IMG.envClosed} alt="" />
          <img className="fem__env-pocket" src={FEMALE_IMG.envPocket} alt="" />
          <div className="fem__flap">
            <img className="fem__flap-in" src={FEMALE_IMG.flapIn} alt="" />
            <img className="fem__flap-out" src={FEMALE_IMG.flapOut} alt="" />
          </div>
          {/* vệt nắng qua cửa sổ đổ lên phong bì — cùng góc/nhịp với vệt nắng trên mặt đá */}
          <div className="fem__env-sun" />
          <div className="fem__seal-fx">
            {Array.from({ length: 12 }, (_, i) => <i key={i} />)}
          </div>
        </div>
      </div>

      {/* CẢNH B (lớp trước): bó hoa đè lên mép trái phong bì + vệt nắng */}
      <div className="fem__b fem__b--front" aria-hidden>
        <div className="fem__plate">
          {/* bó hoa + bóng đổ của nó (bóng rơi lên phong bì và lụa) — đung đưa cùng nhau */}
          <div className="fem__bq" style={pct(PLACE.bouquet)}>
            <img className="fem__bq-shadow" src={FEMALE_IMG.bouquetShadow} alt="" />
            <img className="fem__bouquet" src={FEMALE_IMG.bouquet} alt="" />
          </div>
        </div>
      </div>
      {/* vệt nắng ấm: hoà (soft-light) lên cả cảnh + phong bì */}
      <div className="fem__light" aria-hidden />

      {/* mép gió mềm: dải tối mờ chạy theo đường cắt giữa cảnh cũ và cảnh tulip (thay mặt nạ gradient — nhẹ hơn) */}
      <div className="fem__edge" aria-hidden />
      {/* cơn gió cánh hoa tulip: quét từ trái sang phải, cuốn cảnh cũ đi */}
      <div className="fem__flurry" aria-hidden>
        {FLURRY.map((f, i) => (
          <img key={i} src={f.src} alt="" className={f.depth < 0.3 ? 'is-near' : f.depth > 0.75 ? 'is-far' : ''}
            style={{ top: `${f.top}%`, width: `${f.size}cqw` }} />
        ))}
      </div>



      {/* hạt sáng: popup tan ra rồi xoáy vào miệng phong bì */}
      <canvas className="fem__sparks" aria-hidden />

      <button type="button" className="fem__cta" onClick={onTapEnvelope} disabled={state !== 'FEMALE_WAITING_TAP'}>
        <span>{COPY.female.cta}</span>
      </button>

      {/* xem vé / thư: nền mờ + 2 lá lớn (vé dọc như nhánh Nam, thư ngang) — đảo bài khi vuốt lên */}
      <div className="fem__veil" aria-hidden />
      <div className="fem__deck-letter" aria-hidden={state !== 'FEMALE_LETTER_VIEW'}>
        {cards.letter && <img src={cards.letter} alt={COPY.female.letterAlt} />}
      </div>
      <div className="fem__deck-ticket" aria-hidden={state !== 'FEMALE_TICKET_VIEW'}>
        {cards.ticket && <img src={cards.ticket} alt={COPY.female.ticketAlt} />}
      </div>
      {/* MÀN THIỆP dùng chung với nhánh Nam (chỉ khác thông tin khách) — thư lên trước thì thành màn này */}
      <div className="fem__inv">
        {invMounted && guest && (
          <InvitationScene ref={inv} fullName={guest.fullName} address={guestAddress(guest)} active={state === 'FEMALE_LETTER_VIEW'}
            onBack={() => sendExperience('BACK')} />
        )}
      </div>
      <div className={`fem__deck-touch ${deckActive ? 'is-on' : ''}`} onPointerDown={onDeckDown} onPointerUp={onDeckUp}
        role="button" aria-label={hint || undefined} aria-disabled={!deckActive}>
        {hint && <p key={state} className={`fem__hint ${viewing ? 'is-dark' : ''}`}><span>{hint}</span></p>}
      </div>
    </div>
  )
}
