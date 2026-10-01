import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import CallActions from '../../components/CallScreen/CallActions'
import SlideToAnswer from '../../components/SlideToAnswer/SlideToAnswer'
import GlassPopup, { type GuestForm } from '../../components/GlassPopup/GlassPopup'
import { COPY } from '../../config/copy'
import { bgParallax, callEnterTimeline, knobHint } from '../../animations/gsap/callTimeline'
import { callAnsweredTimeline, popupCloseTimeline, popupOpenTimeline } from '../../animations/gsap/popupTimeline'
import { callMicroInteractions } from '../../animations/anime/microInteractions'
import { useSwipeAnswer } from '../../hooks/useSwipeAnswer'
import { sendExperience, useExperience } from '../../state/experienceMachine'
import { useGuest } from '../../state/guestStore'
import { warmMap } from '../../utils/mapWarm'
import { warmTicket } from '../../api/guestSync'
import './CallScene.css'

gsap.registerPlugin(useGSAP)

// cảnh 3D nhánh Nam: tải riêng (three.js nặng) — tải trước khi popup mở
const loadMale = () => import('../MaleScene/MaleScene')
const MaleScene = lazy(loadMale)
// nhánh Nữ: nhẹ (ảnh + DOM), tải khi popup mở
const loadFemale = () => import('../FemaleScene/FemaleScene')
const FemaleScene = lazy(loadFemale)

/**
 * Cảnh 1 + 2 dùng CHUNG một nền: cuộc gọi → vuốt nghe → popup mọc ra từ thanh trượt.
 * Không đổi nền, không chuyển trang.
 */
export default function CallScene() {
  const root = useRef<HTMLDivElement>(null)
  const slider = useRef<HTMLDivElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const hint = useRef<gsap.core.Timeline | null>(null)
  const answeredTl = useRef<gsap.core.Timeline | null>(null)
  const openTl = useRef<gsap.core.Timeline | null>(null)
  const sliderRect = useRef<DOMRect | null>(null)
  const state = useExperience((s) => s.state)
  // nhánh Nam: form đủ thông tin → dựng sẵn tập tài liệu 3D ở nền (ẩn) trong lúc khách còn đọc/bấm gửi → bấm gửi là chạy hiệu ứng liền
  const [warm, setWarm] = useState(false)
  const warmKey = useRef('')
  const pendKey = useRef('')
  const warmCall = useRef<gsap.core.Tween | null>(null)
  const onWarm = useCallback((data: GuestForm | null) => {
    if (!data) { warmCall.current?.kill(); warmKey.current = ''; pendKey.current = ''; setWarm(false); return }
    const key = [data.fullName, data.nickname, data.photo?.name, data.photo?.size].join('|')
    // chỉ dựng lại khi tên / biệt danh / ảnh đổi (gõ email, SĐT… không huỷ lượt dựng đang chờ)
    if (key === warmKey.current || key === pendKey.current) return
    warmCall.current?.kill()
    pendKey.current = key
    // đợi khách ngừng gõ ~0.4s rồi mới lưu hồ sơ + dựng (tránh dựng lại liên tục)
    warmCall.current = gsap.delayedCall(0.4, () => {
      warmKey.current = key
      pendKey.current = ''
      void useGuest.getState().saveFromForm(data).then(() => setWarm(true)).catch(() => {})
    })
  }, [])
  useEffect(() => () => { warmCall.current?.kill() }, [])

  // --- vào cảnh + chuyển động nhỏ ---
  useGSAP(
    () => {
      const el = root.current!
      const q = (s: string) => el.querySelector<HTMLElement>(s)!
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!reduce) {
        callEnterTimeline({ root: el, bg: q('.call__bg'), header: q('.call__header'), actions: q('.call-actions'), slider: slider.current! })
        hint.current = knobHint(q('[data-knob]'))
      }
      const offParallax = reduce ? () => {} : bgParallax(el, q('.call__bg'))
      const micro = reduce ? null : callMicroInteractions(el)
      return () => {
        offParallax()
        micro?.revert()
      }
    },
    { scope: root },
  )

  // --- vuốt để nghe ---
  const onStart = useCallback(() => {
    hint.current?.kill()
    sendExperience('DRAG_START')
  }, [])
  const onCancelDrag = useCallback(() => sendExperience('DRAG_CANCEL'), [])
  const onAnswer = useCallback(() => {
    if (!sendExperience('ANSWER')) return
    const el = root.current!
    sliderRect.current = slider.current!.getBoundingClientRect()
    answeredTl.current = callAnsweredTimeline(
      [el.querySelector('.call__header')!, el.querySelector('.call-actions')!],
      () => sendExperience('DONE'), // → RSVP_OPEN: popup được gắn vào
    )
  }, [])

  useSwipeAnswer({
    slider,
    enabled: state === 'CALL_IDLE' || state === 'CALL_DRAGGING',
    onStart,
    onCancel: onCancelDrag,
    onAnswer,
  })

  // --- popup mọc ra từ thanh trượt ---
  const showPopup =
    state === 'RSVP_OPEN' || state === 'RSVP_CLOSING' || state === 'RSVP_SUBMITTING' || state === 'MALE_DOCUMENT_ENTER' ||
    state === 'FEMALE_LETTER_TRANSFORM'
  const showFemale = state.startsWith('FEMALE_')
  // "cảnh A" của nhánh Nữ = nền cuộc gọi (ảnh + lớp tối), bị đẩy sang phải khi cảnh tulip đi vào
  const sceneA = useCallback(() => [...root.current!.querySelectorAll<HTMLElement>('.call__bg, .call__shade')], [])
  const isPopup = state === 'RSVP_OPEN' || state === 'RSVP_SUBMITTING'
  const showMale =
    state.startsWith('MALE_') ||
    (warm && isPopup) ||
    ((state === 'TICKET_REVEAL' || state === 'TICKET_VIEW' || state === 'INVITATION_ENTER' || state === 'INVITATION_VIEW' || state === 'INVITATION_EXIT' || state === 'TICKET_STOW') && useGuest.getState().guest?.gender === 'nam')
  useEffect(() => { if (state === 'CALL_IDLE' || state === 'RSVP_CLOSING') { setWarm(false); warmKey.current = ''; pendKey.current = ''; warmCall.current?.kill() } }, [state])
  useLayoutEffect(() => {
    if (state === 'RSVP_OPEN') { void loadMale(); void loadFemale(); warmMap(); warmTicket() }
    if (state !== 'RSVP_OPEN' || !popup.current || openTl.current) return
    const origin = sliderRect.current ?? slider.current!.getBoundingClientRect()
    gsap.to(slider.current, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' })
    openTl.current = popupOpenTimeline(popup.current, origin, () => {})
  }, [state])

  // --- huỷ: popup thu lại vào thanh trượt, cuộc gọi hiện lại ---
  const onCancelPopup = useCallback(() => {
    if (!sendExperience('CANCEL')) return
    const knob = slider.current!.querySelector('[data-knob]')!
    const label = slider.current!.querySelector('.sta__label')!
    // dừng hẳn timeline mở (không reverse — reverse phải đảo từng lớp nên bị khựng)
    openTl.current?.kill()
    openTl.current = null
    const origin = slider.current!.getBoundingClientRect()
    const back = gsap.timeline({ onComplete: () => sendExperience('DONE') }) // → CALL_IDLE
    back
      .add(popupCloseTimeline(popup.current!, origin, () => {}), 0)
      .set(knob, { x: 0 }, 0)
      .set(label, { opacity: 1 }, 0)
      // thanh trượt hiện lại đúng lúc khung kính co về tới nó
      .to(slider.current, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 0.4)
    // giao diện cuộc gọi hiện lại song song (tween thẳng tới trạng thái gốc — không lồng timeline đảo ngược)
    answeredTl.current?.kill()
    answeredTl.current = null
    const el = root.current!
    back.to(
      [el.querySelector('.call__header'), el.querySelector('.call-actions')],
      { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out', stagger: 0.05, clearProps: 'filter,scale' },
      0.2,
    )
    if (new URLSearchParams(location.search).has('qa')) (window as unknown as { __popupClose: unknown }).__popupClose = back
  }, [])

  const onSubmit = useCallback(async (data: GuestForm): Promise<string | null> => {
    if (!sendExperience('SUBMIT')) return null
    try {
      // lưu hồ sơ khách trên máy (ảnh nén ~600px) + gửi toàn bộ thông tin lên Supabase ở nền (không chờ mạng)
      await useGuest.getState().submit(data)
    } catch (e) {
      console.error('[RSVP] lưu thông tin lỗi', e)
      sendExperience('SUBMIT_FAIL')
      return 'Không đọc được ảnh này (có thể là ảnh HEIC). Bạn chọn ảnh JPG/PNG khác nhé.'
    }
    try {
      if (data.gender === 'nu') {
        // nhánh Nữ: tải code + giải mã sẵn toàn bộ ảnh (thư, phong bì, cảnh tulip) rồi mới biến hình
        const m = await loadFemale()
        // ảnh cảnh + vẽ sẵn vé và thiệp (nội dung chung với nhánh Nam) để lúc mở phong bì có ngay
        await Promise.all([m.preloadFemaleAssets(), m.buildCards(useGuest.getState().guest!)])
        sendExperience('GO_FEMALE')
        return null
      }
      await loadMale() // chắc chắn code 3D đã tải xong trước khi biến hình
    } catch (e) {
      console.error('[RSVP] tải cảnh 3D lỗi', e)
      sendExperience('SUBMIT_FAIL')
      return 'Mạng chập chờn, không tải được cảnh tiếp theo. Bạn bấm gửi lại nhé.'
    }
    sendExperience('GO_MALE')
    return null
  }, [])

  return (
    <section className="call" data-scene="call" ref={root} aria-label="Cuộc gọi đến">
      <div className="call__bg" aria-hidden />
      <div className="call__shade" aria-hidden />

      <div className="call__ui">
        <header className="call__header">
          <p className="call__badge">
            <span className="call__dot" aria-hidden />
            {COPY.call.badge}
          </p>
          <h1 className="call__title">{COPY.call.title}</h1>
          <p className="call__subtitle">{COPY.call.subtitle}</p>
        </header>

        <div className="call__bottom">
          <CallActions />
          <SlideToAnswer ref={slider} />
        </div>
      </div>

      {showMale && (
        <Suspense fallback={null}>
          <MaleScene popup={popup} warm={isPopup} />
        </Suspense>
      )}
      {showFemale && (
        <Suspense fallback={null}>
          <FemaleScene popup={popup} sceneA={sceneA} />
        </Suspense>
      )}
      {showPopup && <GlassPopup ref={popup} onCancel={onCancelPopup} onSubmit={onSubmit} onWarm={onWarm} />}
    </section>
  )
}
