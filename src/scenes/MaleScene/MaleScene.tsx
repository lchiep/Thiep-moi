import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { animate } from 'animejs'
import MaleStage, { FOLDER_FIT, TILT, type CameraRigState } from '../../three/MaleStage'
import type { FolderHandle } from '../../components/DocumentFolder/Folder3D'
import { buildFolderAssets, disposeFolderAssets, type FolderAssets } from '../../components/DocumentFolder/folderAssets'
import {
  maleEnterTimeline,
  maleOpenTimeline,
  maleTicketRevealTimeline,
  placeFolderAtStart,
  ticketFocusTimeline,
  maleToInvitationTimeline,
  stowTicketTimeline,
  restTickets,
  projectRect,
} from '../../animations/gsap/maleDocumentTimeline'
import { guestAddress, useGuest } from '../../state/guestStore'
import { sendExperience, useExperience } from '../../state/experienceMachine'
import { COPY } from '../../config/copy'
import WallTitle from '../../components/WallTitle/WallTitle'
import InvitationScene from '../InvitationScene/InvitationScene'
import DustMotes from '../../components/DustMotes/DustMotes'
import './MaleScene.css'

// ?qa: cho kiểm thử tự động tua timeline từng khung
const QA = new URLSearchParams(location.search).has('qa')

/**
 * NHÁNH NAM: tập tài liệu 3D trên nền màn cuộc gọi (nền giữ nguyên).
 * Popup (nằm trên) được timeline "enter" biến thành mặt bìa rồi nhường chỗ cho tập thật.
 */
export default function MaleScene({ popup, warm = false }: { popup: React.RefObject<HTMLDivElement | null>; warm?: boolean }) {
  const guest = useGuest((s) => s.guest)
  const state = useExperience((s) => s.state)
  const [assets, setAssets] = useState<FolderAssets | null>(null)
  const folder = useRef<FolderHandle | null>(null)
  const rig = useRef<CameraRigState>({ fit: FOLDER_FIT.closed, lookZ: FOLDER_FIT.lookClosed, drift: 0, lookX: 0, lookY: 0, tilt: TILT })
  const three = useRef<{ camera: THREE.Camera; canvas: HTMLCanvasElement } | null>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const cta = useRef<HTMLButtonElement>(null)
  const rotateHint = useRef<HTMLParagraphElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const focusCard = useRef<HTMLDivElement>(null)
  const focusVeil = useRef<HTMLDivElement>(null)
  const invPage = useRef<HTMLDivElement>(null)
  const revealTl = useRef<gsap.core.Timeline | null>(null)
  const focusTl = useRef<gsap.core.Timeline | null>(null)
  const [phone, setPhone] = useState<HTMLElement | null>(null)
  useEffect(() => setPhone(stage.current?.closest<HTMLElement>('.app__phone') ?? null), [])

  // xem vé: VUỐT PHẢI (≥ 50px, chủ yếu theo chiều ngang) → sang màn thiệp
  useEffect(() => {
    if (state !== 'TICKET_VIEW' || !cta.current) return
    const el = cta.current
    let x0 = 0
    let y0 = 0
    const down = (e: PointerEvent) => { x0 = e.clientX; y0 = e.clientY }
    const up = (e: PointerEvent) => {
      const dx = e.clientX - x0
      const dy = e.clientY - y0
      if (dx > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) sendExperience('SWIPE')
      else if (dy > 50 && Math.abs(dy) > Math.abs(dx) * 1.3) sendExperience('SWIPE_DOWN') // cất vé
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
    }
  }, [state])

  // vuốt xuống: cất vé vào túi → lại "CHẠM ĐỂ MỞ"
  useEffect(() => {
    if (state !== 'TICKET_STOW' || !folder.current) return
    tl.current?.kill()
    tl.current = stowTicketTimeline({
      folder: folder.current,
      focus: focusTl.current,
      reveal: revealTl.current,
      ticketCard: focusCard.current!,
      onComplete: () => { restTickets(folder.current!); focusTl.current = revealTl.current = null; sendExperience('DONE') }, // → MALE_WAITING_TAP
    })
    if (reduce.current) tl.current.timeScale(2)
    if (QA) (window as unknown as { __maleStow: unknown }).__maleStow = tl.current
  }, [state])

  // cất vé → camera lia trái + zoom vào thiệp → màn thiệp
  useEffect(() => {
    if (state !== 'INVITATION_ENTER' || !folder.current || !three.current || !invPage.current) return
    tl.current?.kill()
    tl.current = maleToInvitationTimeline({
      folder: folder.current,
      rig: rig.current,
      camera: three.current.camera as THREE.PerspectiveCamera,
      stage: stage.current!,
      focus: focusTl.current,
      reveal: revealTl.current,
      inv: invPage.current,
      ticketCard: focusCard.current!,
      fadeOut: [...stage.current!.querySelectorAll('.wall-title, .dust-motes, .male__rotate')],
      onComplete: () => sendExperience('DONE'),
    })
    if (reduce.current) tl.current.timeScale(2)
    if (QA) (window as unknown as { __maleInvite: unknown }).__maleInvite = tl.current
  }, [state])
  // "← Quay lại": tua NGƯỢC chính timeline vào thiệp (từ cuối về lúc camera bắt đầu lia) —
  // thiệp DOM trả vai cho thiệp 3D, nền nhung tắt, camera lùi ra, bìa mở lại, chữ trên tường hiện lại
  useEffect(() => {
    if (state !== 'INVITATION_EXIT') return
    const master = tl.current
    if (!master || master.labels.stowed === undefined) { sendExperience('DONE'); return }
    const back = master.tweenFromTo(master.duration(), 'stowed', {
      duration: reduce.current ? 1.2 : 2.4,
      ease: 'power2.inOut',
      onComplete: () => { restTickets(folder.current!); focusTl.current = revealTl.current = null; sendExperience('DONE') }, // → MALE_WAITING_TAP
    })
    if (QA) (window as unknown as { __maleBack: unknown }).__maleBack = back
  }, [state])
  const reduce = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  // 1. vẽ sẵn thiệp + vé từ dữ liệu khách (đợi font, ảnh).
  //    Chỉ vẽ lại khi phần HIỆN TRÊN vé/thiệp đổi (tên, biệt danh, ảnh, mã vé) — bấm GỬI lưu lại hồ sơ
  //    (email, ngày sinh…) không làm vẽ lại texture giữa lúc hiệu ứng popup → tập tài liệu đang chạy.
  const visKey = guest
    ? [guest.fullName, guest.nickname, guest.gender, guest.ticketNo, guest.photo?.length ?? 0, guest.photo?.slice(-32), guest.photoFocus?.x, guest.photoFocus?.y].join('|')
    : ''
  const guestRef = useRef(guest)
  guestRef.current = guest
  useEffect(() => {
    const guest = guestRef.current
    if (!guest) return
    let alive = true
    let built: FolderAssets | null = null
    buildFolderAssets(guest).then((a) => {
      built = a
      if (QA) (window as unknown as { __folderAssets: unknown }).__folderAssets = a
      if (alive) setAssets(a)
      else disposeFolderAssets(a)
    })
    return () => {
      alive = false
      if (built) disposeFolderAssets(built)
    }
  }, [visKey])

  // 2. khung hình đầu đã vẽ → chạy "popup hoá thành tập tài liệu".
  //    Cảnh được dựng SẴN từ lúc form đủ thông tin (warm): khi khách bấm gửi (state = MALE_DOCUMENT_ENTER) chạy ngay, không đợi dựng.
  const ready = useRef(false)
  const entered = useRef(false)
  const startEnter = () => {
    if (entered.current || !ready.current || !folder.current || !three.current || !popup.current) return
    if (useExperience.getState().state !== 'MALE_DOCUMENT_ENTER') return
    entered.current = true
    tl.current = maleEnterTimeline({
      popup: popup.current,
      folder: folder.current,
      camera: three.current.camera,
      canvas: three.current.canvas,
      onComplete: () => sendExperience('DONE'),
    })
    if (reduce.current) tl.current.timeScale(2.2)
    if (QA) (window as unknown as { __maleEnter: unknown }).__maleEnter = tl.current
  }
  const onReady = () => { ready.current = true; startEnter() }
  useEffect(() => {
    if (state === 'MALE_DOCUMENT_ENTER') startEnter()
    else if (state.startsWith('RSVP_')) entered.current = false // gửi lỗi / huỷ → lần sau chạy lại
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  // 3. mở bìa khi vào MALE_DOCUMENT_OPEN
  useEffect(() => {
    if (state !== 'MALE_DOCUMENT_OPEN' || !folder.current) return
    tl.current?.kill()
    tl.current = maleOpenTimeline(folder.current, rig.current, () => sendExperience('DONE'))
    if (reduce.current) tl.current.timeScale(2.2)
    if (QA) (window as unknown as { __maleOpen: unknown }).__maleOpen = tl.current
  }, [state])

  // 4. lời nhắc "CHẠM ĐỂ MỞ": hiện lên rồi thở nhẹ (Anime.js — chỉ opacity của chữ con)
  useEffect(() => {
    if ((state !== 'MALE_WAITING_TAP' && state !== 'TICKET_VIEW') || !cta.current) return
    const label = cta.current.querySelector('span')!
    const show = animate(cta.current, { opacity: [0, 1], translateY: [6, 0], duration: 700, ease: 'outCubic' })
    const pulse = reduce.current
      ? null
      : animate(label, { opacity: [1, 0.55], duration: 1400, ease: 'inOutSine', loop: true, alternate: true, delay: 700 })
    return () => {
      show.revert()
      pulse?.revert()
    }
  }, [state])

  // gợi ý xoay ngang điện thoại để xem vé rõ
  useEffect(() => {
    if (state !== 'TICKET_VIEW' || !rotateHint.current) return
    const a = animate(rotateHint.current, { opacity: [0, 1], duration: 800, delay: 400, ease: 'outCubic' })
    return () => { a.revert() }
  }, [state])

  // ảnh vé phẳng cho màn xoay ngang (cùng canvas đã vẽ cho texture 3D)
  const ticketSrc = useMemo(() => {
    const img = assets?.ticketMain.image as HTMLCanvasElement | undefined
    return img ? img.toDataURL('image/webp', 0.92) : ''
  }, [assets])

  useEffect(() => () => { tl.current?.kill() }, [])

  /** Chạm trúng vật nào trong tập hồ sơ: hình chiếu thiệp (trang trái) / trang phải (túi vé). */
  const hitAt = (x: number, y: number): 'card' | 'ticket' | null => {
    const f = folder.current, t = three.current
    if (!f || !t) return null
    const pad = 12
    const card = projectRect(f.card, t.camera, t.canvas)
    const all = projectRect(f.root, t.camera, t.canvas)
    const inY = (r: { top: number; height: number }) => y >= r.top - pad && y <= r.top + r.height + pad
    if (x >= card.left - pad && x <= card.left + card.width + pad && inY(card)) return 'card'
    if (x > card.left + card.width && x <= all.left + all.width + pad && inY(all)) return 'ticket'
    return null
  }

  // ?qa: cho test tự động biết chạm vào đâu để trúng thiệp / túi vé (tâm hình chiếu 3D, toạ độ màn hình)
  if (QA) (window as unknown as { __maleTargets: unknown }).__maleTargets = () => {
    const f = folder.current, t = three.current
    if (!f || !t) return null
    const card = projectRect(f.card, t.camera, t.canvas)
    const all = projectRect(f.root, t.camera, t.canvas)
    const right = card.left + card.width
    return {
      card: { x: card.left + card.width / 2, y: card.top + card.height / 2 },
      ticket: { x: (right + all.left + all.width) / 2, y: all.top + all.height / 2 },
    }
  }

  const onTap = (e: React.MouseEvent) => {
    const now = useExperience.getState().state
    if (!folder.current) return
    if (now === 'MALE_WAITING_TAP') {
      const hit = hitAt(e.clientX, e.clientY)
      if (!hit) return // chạm ra ngoài tập hồ sơ: không làm gì
      if (hit === 'card') {
        // vào thẳng thiệp: không có vé đang rút → timeline vào thiệp bỏ qua đoạn cất vé
        focusTl.current = revealTl.current = null
        sendExperience('OPEN_CARD')
        return
      }
      // chạm vé: rút vé ra (chữ gợi ý tắt trong lúc vé bay lên)
      if (!sendExperience('TAP')) return
      tl.current?.kill()
      const f = folder.current
      // vé lên tới nơi → (đo vị trí vé 3D LÚC ĐÓ) chuyển sang vé nét + làm mờ nền, phóng to
      tl.current = revealTl.current = maleTicketRevealTimeline(f, () => {
        tl.current = focusTl.current = ticketFocusTimeline({
          folder: f,
          camera: three.current!.camera,
          canvas: three.current!.canvas,
          stage: stage.current!,
          card: focusCard.current!,
          veil: focusVeil.current!,
        }).eventCallback('onComplete', () => sendExperience('DONE'))
        if (reduce.current) tl.current.timeScale(2.2)
        if (QA) (window as unknown as { __maleFocus: unknown }).__maleFocus = tl.current
      })
      if (reduce.current) tl.current.timeScale(2.2)
      if (QA) (window as unknown as { __maleTicket: unknown }).__maleTicket = tl.current
    }  }

  return (
    <div className={`male ${warm ? 'is-warm' : ''}`} data-scene="male" ref={stage}>
      <DustMotes />
      {guest && (
        <WallTitle nickname={guest.nickname || guest.fullName} show={!warm && state !== 'MALE_DOCUMENT_ENTER'} />
      )}
      {assets && (
        <Canvas
          className="male__canvas"
          shadows="soft"
          frameloop={warm ? 'demand' : 'always'}
          dpr={[1, 1.75]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 30, near: 0.1, far: 40 }}
          onCreated={({ camera, gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.05
            three.current = { camera, canvas: gl.domElement }
          }}
        >
          <MaleStage assets={assets} rig={rig.current} folderRef={folder} onMount={placeFolderAtStart} onReady={onReady} />
        </Canvas>
      )}

      {/* chế độ xem vé: nền mờ + vé nét (vé dọc, ảnh vé ngang xoay 90°) */}
      <div className="male__veil" ref={focusVeil} aria-hidden />
      <div className="male__focus" ref={focusCard} aria-hidden={state !== 'TICKET_VIEW'}>
        {ticketSrc && <img src={ticketSrc} alt={`Vé mời Graduation Gala 2026 của ${guest?.nickname ?? ''}`} />}
      </div>

      <button
        ref={cta}
        type="button"
        className={`male__cta ${state === 'TICKET_VIEW' ? 'is-ticket' : ''}`}
        onClick={onTap}
        disabled={state !== 'MALE_WAITING_TAP' && state !== 'TICKET_VIEW'}
        aria-label={state === 'TICKET_VIEW' ? COPY.male.ctaInvite : COPY.male.cta}
      >
        <span>
          {state === 'TICKET_VIEW' ? COPY.male.ctaInvite : COPY.male.cta}
          {state === 'TICKET_VIEW' && <i className="male__chev" aria-hidden>›››</i>}
        </span>
      </button>

      {/* gợi ý cất vé: ở TRÊN cùng (vé to chiếm gần hết màn, chữ dưới bị vé che) */}
      {state === 'TICKET_VIEW' && <p className="male__stow" aria-hidden>{COPY.male.stowHint}</p>}
      <p className="male__rotate" ref={rotateHint} aria-hidden={state !== 'TICKET_VIEW'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M3 9a9 9 0 0 1 3-4M21 15a9 9 0 0 1-3 4" />
        </svg>
        {COPY.male.rotateHint}
      </p>

      {phone &&
        guest &&
        (state === 'TICKET_VIEW' || state === 'INVITATION_ENTER' || state === 'INVITATION_VIEW' || state === 'INVITATION_EXIT') &&
        createPortal(<InvitationScene ref={invPage} fullName={guest.fullName} address={guestAddress(guest)} active={state === 'INVITATION_VIEW'}
          onBack={() => sendExperience('BACK')} />, phone)}

      {ticketSrc &&
        createPortal(
          <div className={`ticket-land ${state === 'TICKET_VIEW' ? 'is-on' : ''}`}>
            <img src={ticketSrc} alt={`Vé mời Graduation Gala 2026 của ${guest?.nickname ?? ''}`} />
          </div>,
          document.body,
        )}
    </div>
  )
}
