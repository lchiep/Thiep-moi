import { gsap } from 'gsap'
import * as THREE from 'three'
import { EASE } from '../motion'
import { FOLDER, TICKET_POSES, TICKET_SHOW, type FolderHandle } from '../../components/DocumentFolder/Folder3D'
import { FOLDER_FIT, type CameraRigState } from '../../three/MaleStage'
import { handoff, velvetAround } from './invitationHandoff'

/**
 * NHÁNH NAM — 3 timeline GSAP:
 *   1. enter: popup kính co lại thành mặt bìa đen ở mép dưới màn hình → tập trồi lên, hạ xuống giường
 *   2. open : bìa lật quanh gáy trái, camera lùi ra vừa cả 2 trang, vé trượt lên khỏi túi
 *   3. tap  : nhấn lún → nghiêng nhẹ → chuyển cảnh
 * GSAP là chủ duy nhất của vị trí/xoay tập tài liệu và camera rig.
 */

/** Tư thế bắt đầu: thấp dưới mép màn hình, hơi nhấc và nghiêng như đang được đưa lên. */
const START = { pos: [0, 0.2, 1.62] as const, rot: [-0.3, 0.1, 0.04] as const }

/** Hộp bao của tập tài liệu chiếu lên màn hình (toạ độ client, px). */
export function projectRect(obj: THREE.Object3D, camera: THREE.Camera, canvas: HTMLCanvasElement) {
  obj.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(obj)
  const c = canvas.getBoundingClientRect()
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity
  const v = new THREE.Vector3()
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        v.set(x, y, z).project(camera)
        const px = c.left + ((v.x + 1) / 2) * c.width
        const py = c.top + ((1 - v.y) / 2) * c.height
        l = Math.min(l, px); r = Math.max(r, px); t = Math.min(t, py); b = Math.max(b, py)
      }
  return { left: l, top: t, width: r - l, height: b - t }
}

export function placeFolderAtStart(f: FolderHandle) {
  f.root.position.set(...START.pos)
  f.root.rotation.set(...START.rot)
  f.root.visible = false
}

type EnterArgs = {
  popup: HTMLElement
  folder: FolderHandle
  camera: THREE.Camera
  canvas: HTMLCanvasElement
  onComplete: () => void
}

export function maleEnterTimeline({ popup, folder, camera, canvas, onComplete }: EnterArgs) {
  const shell = popup.querySelector<HTMLElement>('.gp__shell')!
  const items = popup.querySelectorAll('[data-gp-item], .gp__sparkle, .gp-orb, .gp__title h2')
  const inner = popup.querySelectorAll('.gp__card, .gp__title')
  const air = popup.querySelectorAll('.gp__veil, .gp__light')

  const s = shell.getBoundingClientRect()
  const root = folder.root

  /*
   * Hiệp chê bản cũ (kính co thành 1 hộp đen trống ở mép dưới rồi mới hiện tập tài liệu).
   * Bản mới: tập tài liệu THẬT đã có mặt ngay từ đầu, trồi lên từ mép dưới; tấm kính popup co lại và
   * "bám" dần vào đúng mặt bìa đang trồi lên (đo hình chiếu 3D từng khung hình), vừa bám vừa trong dần
   * — như lớp kính tan lên bìa. Không có khoảnh khắc nào màn hình chỉ còn 1 khối trống.
   */
  const k = { v: 0 }
  const follow = () => {
    const r = projectRect(root, camera, canvas)
    const e = k.v
    const l = s.left + (r.left - s.left) * e
    const t = s.top + (r.top - s.top) * e
    const w = s.width + (r.width - s.width) * e
    const h = s.height + (r.height - s.height) * e
    gsap.set(shell, { x: l - s.left, y: t - s.top, scaleX: w / s.width, scaleY: h / s.height })
  }

  const tl = gsap.timeline({ onComplete })
  tl.addLabel('fold')
    // 1. nội dung form lặng đi, các lớp kính con tan vào tấm kính lớn
    .to(items, { autoAlpha: 0, y: 8, duration: 0.32, stagger: { each: 0.012, from: 'end' }, ease: 'power2.in' }, 'fold')
    .to(inner, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 'fold+=0.15')
    .to(air, { autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, 'fold+=0.2')
    .set(shell, { transformOrigin: '0 0' }, 'fold')
    // 2. tập tài liệu có mặt ngay, trồi lên từ mép dưới (vật nặng: chậm, có quán tính)
    .set(root, { visible: true }, 'fold+=0.1') // tween 0s: tua/đảo ngược timeline vẫn đúng
    .addLabel('rise', 'fold+=0.1')
    .to(root.position, { z: 0, duration: 1.8, ease: 'power3.out' }, 'rise')
    .to(root.position, { y: 0, duration: 1.65, ease: 'power2.inOut' }, 'rise+=0.1')
    .to(root.rotation, { x: 0, y: 0, z: 0, duration: 1.75, ease: EASE.settle }, 'rise+=0.05')
    // 3. tấm kính co lại, bám theo mặt bìa đang trồi lên, bo góc nhỏ dần như mép bìa
    .to(k, { v: 1, duration: 1.3, ease: 'power2.inOut', onUpdate: follow }, 'fold+=0.15')
    .to(shell, { borderRadius: 8, duration: 1.3, ease: 'power2.inOut' }, 'fold+=0.15')
    // 4. vừa bám vào bìa vừa trong dần → như lớp kính tan lên mặt bìa (không đổi màu thành hộp đen)
    .to(shell, { autoAlpha: 0, duration: 0.75, ease: 'power1.in' }, 'fold+=0.75')
  return tl
}

export function maleOpenTimeline(folder: FolderHandle, rig: CameraRigState, onComplete: () => void) {
  const tl = gsap.timeline({ onComplete, delay: 0.25 })
  tl.addLabel('open')
    // bìa lật quanh gáy: nhấc lên, vượt qua đỉnh, hạ xuống bên trái
    .to(folder.coverPivot.rotation, { z: Math.PI * 0.985, duration: 1.55, ease: 'power3.inOut' }, 'open')
    // camera lùi + cả tập dịch phải để 2 trang nằm giữa màn hình
    .to(rig, { fit: FOLDER_FIT.open, lookZ: FOLDER_FIT.lookOpen, duration: 1.6, ease: 'power3.inOut' }, 'open')
    .to(folder.root.position, { x: FOLDER.W / 2, duration: 1.6, ease: 'power3.inOut' }, 'open')
    // vé: 0% trong túi → 50% bắt đầu trượt lên → 80% lộ ra → 100% nằm yên
    .addLabel('tickets', 'open+=0.78')
  folder.tickets.forEach((t, i) => {
    const out = TICKET_POSES[i].out
    const at = `tickets+=${i === 0 ? 0.18 : 0}` // vé phụ (nằm dưới) nhích trước, vé chính theo sau
    tl.to(t.position, { x: out.x, z: out.z, duration: 1.05, ease: EASE.paper }, at)
      .to(t.rotation, { y: out.rot, duration: 1.1, ease: EASE.paper }, at)
  })
  tl.to(rig, { drift: 0.012, duration: 1.2, ease: 'sine.out' }, '>-0.4')
  return tl
}

/**
 * Chạm lần 1: rút vé chính ra khỏi túi (trượt dọc theo trang, không xuyên qua túi)
 * → nhấc lên, xoay mặt về phía người xem, phóng lớn giữa màn hình.
 */
/** Đặt 2 vé về ĐÚNG tư thế cắm trong túi (sau khi cất vé / quay lại từ thiệp) — xoá mọi sai lệch tích luỹ. */
export function restTickets(folder: FolderHandle) {
  folder.tickets.forEach((t, i) => {
    const p = TICKET_POSES[i]
    gsap.set(t.position, { x: p.out.x, y: FOLDER.T + p.inside.y, z: p.out.z })
    gsap.set(t.rotation, { x: 0, y: p.out.rot, z: 0 })
    gsap.set(t.scale, { x: 1, y: 1, z: 1 })
    t.visible = true
  })
}

export function maleTicketRevealTimeline(folder: FolderHandle, onComplete: () => void) {
  const t = folder.tickets[0]
  const s = TICKET_SHOW
  /*
   * MỘT chuyển động liền mạch (không dừng giữa các pha):
   *  0.00–0.55  vé trượt dọc ra khỏi túi (nhấc rất ít để không xuyên túi)
   *  0.25–1.15  vé nhấc lên + xoay mặt về người xem + to dần — TĂNG TỐC (power2.in)
   *  1.15       đổi sang vé DOM, tiếp tục GIẢM TỐC tới vị trí cuối (ticketFocusTimeline, power2.out)
   *  → tốc độ nối nhau ở điểm đổi, mắt thấy như một đường cong ease-in-out duy nhất.
   */
  return gsap
    .timeline({ onComplete })
    .addLabel('pull')
    // TUYỆT ĐỐI (không '-=0.5'): rút vé nhiều lần vẫn luôn từ đúng chỗ, không trôi dần lên
    .to(t.position, { z: TICKET_POSES[0].out.z - 0.5, duration: 0.55, ease: 'sine.inOut' }, 'pull')
    .to(t.rotation, { y: 0, duration: 0.55, ease: 'sine.inOut' }, 'pull')
    .addLabel('lift', 'pull+=0.25')
    .to(t.position, { y: s.y, duration: 0.9, ease: 'power2.in' }, 'lift')
    .to(t.position, { x: s.x, duration: 0.9, ease: 'power1.inOut' }, 'lift')
    .to(t.position, { z: s.z, duration: 0.9, ease: 'power1.inOut' }, 'lift+=0.3')
    .to(t.rotation, { x: s.tilt, duration: 0.9, ease: 'power2.inOut' }, 'lift')
    .to(t.scale, { x: s.scale, y: s.scale, z: s.scale, duration: 0.9, ease: 'power2.in' }, 'lift')
}

export function maleTapTimeline(folder: FolderHandle, rig: CameraRigState, onComplete: () => void) {
  const r = folder.root
  return gsap
    .timeline({ onComplete })
    .to(r.scale, { x: 0.985, y: 0.985, z: 0.985, duration: 0.12, ease: 'power2.out' })
    .to(r.rotation, { x: -0.035, duration: 0.28, ease: 'power2.out' }, '>-0.02')
    .to(r.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out' }, '<')
    .to(rig, { fit: rig.fit * 0.94, duration: 0.42, ease: 'power2.inOut' }, '<')
}

/**
 * Vé bay lên xong → "đổi vai" sang vé DOM nét căng, rồi làm mờ cả cảnh phía sau
 * (lớp backdrop-filter) và phóng vé to thêm vào giữa màn hình.
 * FLIP: vé DOM bắt đầu đúng hình chiếu của vé 3D (projectRect) → không thấy nhảy.
 */
const SHADOW = 'drop-shadow(0 22px 28px rgba(0,0,0,0.55)) drop-shadow(0 4px 8px rgba(0,0,0,0.35))'

type FocusArgs = {
  folder: FolderHandle
  camera: THREE.Camera
  canvas: HTMLCanvasElement
  stage: HTMLElement // khung .male (toạ độ gốc)
  card: HTMLElement // khung vé DOM (vé dọc)
  veil: HTMLElement // lớp làm mờ nền
}
export function ticketFocusTimeline({ folder, camera, canvas, stage, card, veil }: FocusArgs) {
  const t3d = folder.tickets[0]
  const from = projectRect(t3d, camera, canvas)
  const box = stage.getBoundingClientRect()
    const ratio = 635 / 1608
  // vé TO: gần kín chiều cao, chừa ĐỈNH cho "↓ Vuốt xuống để cất vé" và ĐÁY cho lời nhắc vuốt phải
  // vé TO, nằm giữa: chừa đỉnh cho "↓ Vuốt xuống để cất vé", đáy cho gợi ý xoay ngang
  const h = Math.min(box.height * 0.84, (box.width * 0.96) / ratio)
  const w = h * ratio
  const left = (box.width - w) / 2
  const top = Math.max(box.height * 0.068, box.height * 0.49 - h / 2)
  gsap.set(card, { left, top, width: w, height: h, x: 0, y: 0, scale: 1, transformOrigin: '0 0' })
  const sx = from.width / w
  return gsap
    .timeline()
    .set(card, {
      autoAlpha: 1,
      x: from.left - box.left - left,
      y: from.top - box.top - top,
      scale: sx,
      filter: `brightness(0.86) ${SHADOW}`,
    })
    .set(t3d, { visible: false })
    .addLabel('focus')
    // nối tiếp đà tăng tốc của vé 3D → chỉ còn giảm tốc (power2.out), không khựng
    .to(card, { x: 0, y: 0, scale: 1, filter: `brightness(1) ${SHADOW}`, duration: 0.7, ease: 'power2.out' }, 'focus')
    .to(veil, { autoAlpha: 1, duration: 0.8, ease: 'sine.out' }, 'focus')
}

/**
 * VUỐT PHẢI → MÀN THIỆP (theo ý Hiệp):
 *  1. vé thu nhỏ bay ngược về, cắm lại vào túi (đảo 2 timeline đã chạy)
 *  2. bìa hạ phẳng, camera LIA SANG TRÁI + dựng thẳng góc nhìn + ZOOM từ từ vào thiệp
 *     tới đúng khung tờ giấy của màn thiệp (tính từ getBoundingClientRect của .inv__paper)
 *  3. thiệp 3D "trở thành" thiệp DOM: nền nhung đỏ đô hiện dần quanh, nội dung + dấu sáp hiện lên
 */
type InviteArgs = {
  folder: FolderHandle
  rig: CameraRigState
  camera: THREE.PerspectiveCamera
  stage: HTMLElement
  focus: gsap.core.Timeline | null
  reveal: gsap.core.Timeline | null
  inv: HTMLElement
  ticketCard: HTMLElement // vé DOM của bước xem vé
  fadeOut: Element[]
  onComplete: () => void
}
/**
 * Vuốt xuống ở màn xem vé: cất vé lại vào túi (đảo 2 timeline rút vé), KHÔNG sang thiệp.
 * Giống đoạn đầu của maleToInvitationTimeline: vé DOM thu về đúng hình chiếu vé 3D → vé 3D trượt vào túi.
 */
export function stowTicketTimeline(a: {
  folder: FolderHandle
  focus: gsap.core.Timeline | null
  reveal: gsap.core.Timeline | null
  ticketCard: HTMLElement
  onComplete: () => void
}) {
  const tl = gsap.timeline({ onComplete: a.onComplete })
  if (a.focus) tl.add(a.focus.pause().tweenFromTo(a.focus.duration(), 0, { ease: 'none', duration: a.focus.duration() * 0.7 }))
  tl.set(a.ticketCard, { autoAlpha: 0 }).set(a.folder.tickets[0], { visible: true })
  if (a.reveal) tl.add(a.reveal.pause().tweenFromTo(a.reveal.duration(), 0, { ease: 'none', duration: a.reveal.duration() * 0.75 }))
  return tl
}

export function maleToInvitationTimeline(a: InviteArgs) {
  // đích camera: đo trước (tạm hạ bìa phẳng để lấy đúng toạ độ thiệp, rồi trả lại)
  const pivot = a.folder.coverPivot
  const keepZ = pivot.rotation.z
  pivot.rotation.z = Math.PI
  const card = a.folder.card
  card.updateWorldMatrix(true, false)
  const c = new THREE.Vector3()
  card.getWorldPosition(c)
  pivot.rotation.z = keepZ
  const g = (card.geometry as THREE.PlaneGeometry).parameters
  const cw = g.width
  const stage = a.stage.getBoundingClientRect()
  const paper = a.inv.querySelector('.inv__paper')!.getBoundingClientRect()
  // khớp tuyệt đối tỉ lệ thiệp 3D với tờ giấy DOM của máy này (chữ theo % sẽ trùng khít)
  const sy = paper.height / paper.width / (g.height / g.width)
  const fit = (cw * stage.width) / paper.width
  const visH = fit / (stage.width / stage.height)
  const dy = ((paper.top + paper.height / 2 - stage.top) / stage.height - 0.5) * visH

  const master = gsap.timeline({ onComplete: a.onComplete })

  // 1. cất vé lại (đảo chiều, nhanh hơn một chút)
  if (a.focus) master.add(a.focus.pause().tweenFromTo(a.focus.duration(), 0, { ease: 'none', duration: a.focus.duration() * 0.75 }))
  // vé DOM đã thu về đúng hình chiếu vé 3D → đổi vai lại cho vé 3D (tween 0s: tua ngược vẫn đúng)
  master.set(a.ticketCard, { autoAlpha: 0 }).set(a.folder.tickets[0], { visible: true })
  if (a.reveal) master.add(a.reveal.pause().tweenFromTo(a.reveal.duration(), 0, { ease: 'none', duration: a.reveal.duration() * 0.8 }))
  master.addLabel('stowed') // vé đã nằm yên trong túi — nút "← Quay lại" tua về đúng điểm này

  // 2. bìa hạ phẳng, camera lia trái + dựng thẳng + zoom từ từ vào thiệp
  master
    .addLabel('cam', '-=0.15')
    .to(pivot.rotation, { z: Math.PI, duration: 0.9, ease: 'power2.inOut' }, 'cam')
    .to(card.scale, { y: sy, duration: 1.2, ease: 'sine.inOut' }, 'cam')
    .to(a.fadeOut, { autoAlpha: 0, duration: 0.9, ease: 'power1.out' }, 'cam')
    .to(a.rig, { lookX: c.x, lookY: c.y, drift: 0, duration: 1.4, ease: 'power2.inOut' }, 'cam')
    .to(a.rig, { tilt: 0, lookZ: c.z - dy, duration: 2.2, ease: 'power2.inOut' }, 'cam+=0.15')
    .to(a.rig, { fit, duration: 2.5, ease: 'power3.inOut' }, 'cam+=0.3') // chậm dần khi chạm khung
    // nền nhung đỏ đô hiện dần QUANH chỗ tờ thiệp sẽ nằm (khoét lỗ đúng khung giấy) ngay trong lúc
    // camera sắp chạm khung → không lộ dải tối / mép cảnh 3D phía trên tờ thiệp khi đổi vai
    .add(velvetAround(a.inv), 'cam+=1.5')
    // 3. thiệp 3D trở thành thiệp DOM
    .add(handoff(a.inv), '>-0.05')
  return master
}

