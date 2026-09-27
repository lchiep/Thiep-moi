import { gsap } from 'gsap'
import { EASE } from '../motion'

/**
 * NHÁNH NỮ — từ lúc bấm GỬI tới khi cảnh tulip chờ khách chạm vào thư.
 *
 *   popup co lại thành LÁ THƯ (đúng chỗ popup)
 *   → phong bì mở trồi lên từ mép dưới
 *   → thư canh miệng phong bì, thu nhỏ nhẹ → TRƯỢT VÀO (bị thân phong bì che thật, không mờ dần)
 *   → nắp gập xuống quanh nếp gấp (mặt ngoài có dấu sáp ở mũi nắp) → phong bì nhún
 *   → LẬT TRANG: phong bì được nhấc lên, cả cảnh cuộc gọi lật đi như một trang sách (bản lề mép phải,
 *     tối dần khi nghiêng khỏi nắng, đổ bóng lên cảnh mới) → cảnh tulip lộ ra bên dưới, camera lùi nhẹ về
 *   → phong bì xoay nhẹ, đáp xuống lụa · bó hoa được đặt lên, đè mép trái phong bì · KitKat
 *   → cánh hoa rơi chao nghiêng xuống · nắng quét · "CHẠM VÀO THƯ ĐỂ MỞ"
 *
 * GSAP là chủ duy nhất của transform/opacity các vật này. Vị trí đích đo bằng getBoundingClientRect
 * (không hard-code pixel). State machine đi tiếp từng bước bằng callback ở các mốc (onStep).
 */
export type FemaleRefs = {
  stage: HTMLElement
  popup: HTMLElement | null
  sceneA: HTMLElement[] // nền cảnh cuộc gọi (ảnh + lớp tối) — "trang" bị lật đi
  sceneB: HTMLElement[] // 2 "tấm ảnh" của cảnh tulip (lớp sau + lớp bó hoa) — camera lùi nhẹ
  turnShadow: HTMLElement
  letter: HTMLElement // lá thư "tự do" (sinh ra từ popup)
  env: HTMLElement // phong bì: vị trí/xoay/scale
  envFloat: HTMLElement // lớp trong: nhún khi thư chạm đáy / khi nắp đóng
  envShadow: HTMLElement
  envLetter: HTMLElement // lá thư NẰM TRONG phong bì (giữa thân sau và thân trước)
  envClosed: HTMLElement // thân phong bì đã đóng (E1) — hiện khi nắp nằm hẳn xuống
  flap: HTMLElement
  spot: HTMLElement // chỗ phong bì nằm trong cảnh tulip
  bouquet: HTMLElement
  choc: HTMLElement
  petals: HTMLElement[]
  light: HTMLElement
  cta: HTMLElement
}

export type FemaleStep = 'letter' | 'closed' | 'pan' | 'ready' | 'waiting'

const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

export function femaleTransitionTimeline(o: FemaleRefs, onStep: (step: FemaleStep) => void) {
  // ---------- đo khi mọi thứ còn ở vị trí gốc (chưa transform) ----------
  const stageR = o.stage.getBoundingClientRect()
  const E = o.env.getBoundingClientRect() // thân phong bì lúc nằm yên ở cảnh 1
  const L = o.letter.getBoundingClientRect() // lá thư tự do ở giữa màn
  const I = o.envLetter.getBoundingClientRect() // lá thư khi đã nằm hẳn trong phong bì
  const T = o.spot.getBoundingClientRect() // chỗ phong bì đáp trong cảnh tulip
  const flapH = o.flap.getBoundingClientRect().height
  const Ec = center(E), Ic = center(I), Tc = center(T)

  // lá thư hạ xuống ngay trên miệng phong bì: đáy thư chạm mép trên thân, cùng cỡ với thư bên trong
  const k = I.width / L.width
  const hoverCy = E.top - I.height / 2 + 2
  const letterTo = { x: Ic.x - center(L).x, y: hoverCy - center(L).y, scale: k }
  const insideStartY = hoverCy - Ic.y // cùng chỗ đó, tính cho lá thư bên trong phong bì

  // ---------- trạng thái đầu ----------
  // nền cuộc gọi nằm TRÊN cảnh tulip (cảnh tulip đã sẵn bên dưới, chờ trang lật)
  gsap.set(o.sceneA, { zIndex: (i) => 2 + i, transformOrigin: '100% 50%', transformPerspective: 1300, backfaceVisibility: 'hidden' })
  gsap.set(o.sceneB, { scale: 1.08, transformOrigin: '50% 55%' })
  // dưới mép màn: cộng cả chiều cao nắp đang mở (nắp nằm trên thân) để không ló mũi nắp
  gsap.set(o.env, { y: stageR.bottom - E.top + flapH + 30, rotation: 5, transformOrigin: '50% 50%' })
  gsap.set(o.envShadow, { autoAlpha: 0.55 })
  gsap.set(o.envLetter, { autoAlpha: 0, y: insideStartY })
  gsap.set(o.envClosed, { autoAlpha: 0 })
  gsap.set(o.letter, { autoAlpha: 0, scale: 1.05, transformOrigin: '50% 50%' })
  gsap.set(o.flap, { rotationX: 0, transformPerspective: 900, transformOrigin: '50% 100%', zIndex: 0 })
  gsap.set([o.bouquet, o.choc, ...o.petals, o.light, o.cta], { autoAlpha: 0 })

  const tl = gsap.timeline()

  // ---------- 1. popup → lá thư ----------
  tl.addLabel('paper', 0)
  if (o.popup) {
    const pr = o.popup.getBoundingClientRect()
    const inset = `inset(${L.top - pr.top}px ${pr.right - L.right}px ${pr.bottom - L.bottom}px ${L.left - pr.left}px round 6px)`
    tl.to(o.popup.querySelectorAll('[data-gp-item]'), { autoAlpha: 0, y: -6, duration: 0.28, ease: 'power2.in' }, 'paper')
      .fromTo(o.popup, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: inset, duration: 0.8, ease: 'power3.inOut' }, 'paper+=0.05')
      .to(o.popup, { autoAlpha: 0, duration: 0.25, ease: 'power1.out' }, 'paper+=0.72')
  }
  // giấy "đặc lại" đúng trong khung kính đang co
  tl.to(o.letter, { autoAlpha: 1, scale: 1, duration: 0.6, ease: EASE.paper }, 'paper+=0.42')
    .call(() => onStep('letter'), [], 'paper+=1') // → FEMALE_ENVELOPE_INSERT (popup đã tắt hẳn)

  // ---------- 2. phong bì trồi lên ----------
  tl.addLabel('rise', 'paper+=0.75')
    .to(o.env, { y: 0, rotation: 0, duration: 1.15, ease: 'power3.out' }, 'rise')

  // ---------- 3. thư canh miệng phong bì (thu nhỏ nhẹ) ----------
  tl.addLabel('align', 'rise+=0.7')
    .to(o.letter, { x: letterTo.x, y: letterTo.y, scale: letterTo.scale, duration: 0.85, ease: 'power2.inOut' }, 'align')
    .fromTo(o.letter, { rotation: 0 }, { rotation: -1.5, duration: 0.4, ease: 'sine.out', yoyo: true, repeat: 1 }, 'align')

  // ---------- 4. trao vai: thư tự do → thư trong phong bì (cùng khung hình, cùng chỗ) ----------
  tl.addLabel('insert', 'align+=0.9')
    .set(o.envLetter, { autoAlpha: 1, y: insideStartY }, 'insert')
    .set(o.letter, { autoAlpha: 0 }, 'insert')
    .to(o.envLetter, { y: 0, duration: 1.05, ease: 'power2.inOut' }, 'insert+=0.02')
    .fromTo(o.envLetter, { rotation: 0.8 }, { rotation: 0, duration: 1.05, ease: 'power2.out' }, 'insert+=0.02')
    .to(o.envFloat, { y: 3, duration: 0.18, ease: 'power2.out' }, 'insert+=0.9')
    .to(o.envFloat, { y: 0, duration: 0.35, ease: 'power2.inOut' }, 'insert+=1.08')

  // ---------- 5. nắp gập xuống ----------
  tl.addLabel('close', 'insert+=1.25')
    .to(o.flap, { rotationX: -180, duration: 0.95, ease: 'power2.inOut' }, 'close')
    .set(o.flap, { zIndex: 5 }, 'close+=0.47') // qua 90° → nắp nằm TRÊN thân trước + lá thư
    // nắp nằm hẳn → thân phong bì hoàn chỉnh (mặt sau đã đóng); nhún nhẹ như vừa ấn dấu sáp
    .to(o.envClosed, { autoAlpha: 1, duration: 0.18, ease: 'none' }, 'close+=0.9')
    .to(o.envFloat, { scale: 0.985, duration: 0.12, ease: 'power2.out' }, 'close+=0.92')
    .to(o.envFloat, { scale: 1, duration: 0.35, ease: EASE.settle }, 'close+=1.04')
    .call(() => onStep('closed'), [], 'close+=1.05') // → FEMALE_ENVELOPE_CLOSED

  // ---------- 6. LẬT TRANG ----------
  tl.addLabel('lift', 'close+=1.3')
    // phong bì được nhấc lên về phía người xem (to hơn, bóng loang rộng ra)
    .to(o.env, { y: -24, scale: 1.08, rotation: -4, duration: 0.7, ease: 'power2.out' }, 'lift')
    .to(o.envShadow, { autoAlpha: 0.3, y: 26, scale: 1.08, duration: 0.7, ease: 'power2.out' }, 'lift')
    .call(() => onStep('pan'), [], 'lift+=0.3') // → FEMALE_SCENE_TRANSITION

  tl.addLabel('turn', 'lift+=0.35')
    // trang (nền cuộc gọi) lật quanh mép phải, nghiêng khỏi nắng thì tối dần
    .to(o.sceneA, { rotationY: -118, xPercent: 8, duration: 1.7, ease: 'power2.inOut' }, 'turn')
    .to(o.sceneA[0], { filter: 'brightness(0.45)', duration: 1.1, ease: 'power1.in' }, 'turn')
    // bóng của trang đổ lên cảnh mới: đậm lúc trang còn gần, nhạt dần khi trang lật qua
    .fromTo(o.turnShadow, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 1.5, ease: 'power2.in' }, 'turn+=0.15')
    // camera lùi nhẹ về, cảnh mới "mở ra"
    .to(o.sceneB, { scale: 1, duration: 2.2, ease: 'power3.out' }, 'turn')
    .call(() => onStep('ready'), [], 'turn+=1.7') // → FEMALE_SCENE_READY

  // ---------- 7. cảnh tulip vào lần lượt ----------
  tl.addLabel('enter', 'turn+=0.75')
    // phong bì xoay nửa vòng nhẹ rồi đáp xuống lụa đúng chỗ đã chừa (đo từ khung đích)
    .to(o.env, { x: Tc.x - Ec.x, y: Tc.y - Ec.y, scale: T.width / E.width, rotation: -3, duration: 1.4, ease: 'power3.inOut' }, 'enter')
    .to(o.envShadow, { autoAlpha: 0.55, x: 5, y: 8, scale: 1, duration: 1.4, ease: 'power3.inOut' }, 'enter')
    // bó hoa được đặt xuống từ bên trái, đè lên mép trái phong bì
    .fromTo(o.bouquet, { autoAlpha: 0, xPercent: -22, yPercent: 6, rotation: -9, scale: 1.06 },
      { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: 0, scale: 1, duration: 1.3, ease: 'power3.out' }, 'enter+=0.9')
    .fromTo(o.choc, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: EASE.paper }, 'enter+=1.5')
    // cánh hoa rơi: chao nghiêng qua lại rồi nằm yên
    .fromTo(o.petals, { autoAlpha: 0, yPercent: -140, xPercent: 25, rotation: -70 },
      { autoAlpha: 1, yPercent: 0, xPercent: 0, rotation: 0, duration: 1.9, ease: 'power2.out', stagger: 0.28 }, 'enter+=1.6')
    .fromTo(o.light, { autoAlpha: 0, xPercent: -35 }, { autoAlpha: 1, xPercent: 0, duration: 1.8, ease: 'power2.out' }, 'enter+=1.9')
    .fromTo(o.cta, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.ui }, 'enter+=2.9')
    .call(() => onStep('waiting'), [], 'enter+=3.2') // → FEMALE_WAITING_TAP

  return tl
}

/** Cảnh tulip "thở": hoa đung đưa rất nhẹ, cánh hoa trôi li ti, phong bì nghiêng 1–2°, nắng dịch chậm. */
export function femaleIdle(o: { bouquet: HTMLElement; petals: HTMLElement[]; envFloat: HTMLElement; light: HTMLElement }) {
  const tl = gsap.timeline()
  tl.to(o.bouquet, { rotation: 0.6, duration: 3.4, ease: EASE.sway, yoyo: true, repeat: -1, transformOrigin: '15% 100%' }, 0)
    .to(o.envFloat, { rotation: 1.2, y: -2, duration: 2.8, ease: EASE.sway, yoyo: true, repeat: -1 }, 0.4)
    .to(o.light, { xPercent: 6, duration: 7, ease: EASE.sway, yoyo: true, repeat: -1 }, 0)
  o.petals.forEach((p, i) =>
    tl.to(p, { y: i % 2 ? 2 : -2, rotation: i % 2 ? -2 : 2, duration: 2.6 + i * 0.5, ease: EASE.sway, yoyo: true, repeat: -1 }, i * 0.3),
  )
  return tl
}

/** Chạm vào phong bì: nhấn xuống rồi bật lại (phản hồi ngay). */
export function envelopePress(envFloat: HTMLElement) {
  return gsap
    .timeline()
    .to(envFloat, { scale: 0.98, duration: 0.12, ease: 'power2.out' })
    .to(envFloat, { scale: 1, duration: 0.3, ease: EASE.settle })
}
