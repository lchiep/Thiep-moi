import { gsap } from 'gsap'
import { EASE } from '../motion'

/**
 * NHÁNH NỮ — từ lúc bấm GỬI tới khi cảnh tulip chờ khách chạm vào thư.
 *
 *   popup co lại thành LÁ THƯ (đúng chỗ popup)
 *   → phong bì mở trồi lên từ mép dưới
 *   → thư canh miệng phong bì, thu nhỏ nhẹ → TRƯỢT VÀO (bị thân phong bì che thật, không mờ dần)
 *   → nắp gập xuống quanh nếp gấp (mặt ngoài có dấu sáp ở mũi nắp) → phong bì nhún
 *   → CƠN GIÓ CÁNH HOA: phong bì được nhấc lên, một đợt cánh tulip cuộn từ trái sang phải (gần–xa, nhoè
 *     theo chiều sâu); mép đợt gió "cuốn" cảnh cuộc gọi đi (mặt nạ mềm chạy theo), để lộ sẵn bàn tĩnh vật:
 *     lụa + bó hoa + KitKat đã nằm đó
 *   → phong bì chao xuống, luồn dưới bó hoa · nắng quét · "CHẠM VÀO THƯ ĐỂ MỞ"
 *
 * GSAP là chủ duy nhất của transform/opacity các vật này. Vị trí đích đo bằng getBoundingClientRect
 * (không hard-code pixel). State machine đi tiếp từng bước bằng callback ở các mốc (onStep).
 */
export type FemaleRefs = {
  stage: HTMLElement
  popup: HTMLElement | null
  sceneA: HTMLElement[] // nền cảnh cuộc gọi (ảnh + lớp tối) — bị gió cuốn đi
  sceneB: HTMLElement[] // 2 "tấm ảnh" của cảnh tulip (lớp sau + lớp bó hoa) — camera lùi nhẹ
  frontPlate: HTMLElement // lớp bó hoa (nằm trên phong bì) — lộ ra cùng mép gió
  flurry: HTMLElement[] // cánh hoa bay trong cơn gió
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
  gsap.set(o.sceneA, { zIndex: (i) => 2 + i })
  gsap.set(o.sceneB, { scale: 1.05, transformOrigin: '50% 55%' })
  // mặt nạ mềm theo mép gió: cảnh cũ mất dần từ trái sang phải, lớp bó hoa hiện ra đúng theo mép đó
  const WIPE = { '--wipe': '-20%' }
  gsap.set(o.sceneA, { ...WIPE, maskImage: 'linear-gradient(90deg, transparent calc(var(--wipe) - 16%), #000 var(--wipe))', webkitMaskImage: 'linear-gradient(90deg, transparent calc(var(--wipe) - 16%), #000 var(--wipe))' })
  gsap.set(o.frontPlate, { ...WIPE, maskImage: 'linear-gradient(90deg, #000 calc(var(--wipe) - 16%), transparent var(--wipe))', webkitMaskImage: 'linear-gradient(90deg, #000 calc(var(--wipe) - 16%), transparent var(--wipe))' })
  gsap.set(o.flurry, { autoAlpha: 0 })
  // dưới mép màn: cộng cả chiều cao nắp đang mở (nắp nằm trên thân) để không ló mũi nắp
  gsap.set(o.env, { y: stageR.bottom - E.top + flapH + 30, rotation: 5, transformOrigin: '50% 50%' })
  gsap.set(o.envShadow, { autoAlpha: 0.55 })
  gsap.set(o.envLetter, { autoAlpha: 0, y: insideStartY })
  gsap.set(o.envClosed, { autoAlpha: 0 })
  gsap.set(o.letter, { autoAlpha: 0, scale: 1.05, transformOrigin: '50% 50%' })
  gsap.set(o.flap, { rotationX: 0, transformPerspective: 900, transformOrigin: '50% 100%', zIndex: 0 })
  gsap.set([o.light, o.cta], { autoAlpha: 0 })

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
    .to(o.envClosed, { autoAlpha: 1, duration: 0.22, ease: 'power1.in' }, 'close+=0.52')
    .to(o.envFloat, { scale: 0.985, duration: 0.12, ease: 'power2.out' }, 'close+=0.92')
    .to(o.envFloat, { scale: 1, duration: 0.35, ease: EASE.settle }, 'close+=1.04')
    .call(() => onStep('closed'), [], 'close+=1.05') // → FEMALE_ENVELOPE_CLOSED

  // ---------- 6. CƠN GIÓ CÁNH HOA ----------
  tl.addLabel('lift', 'close+=1.3')
    // phong bì được nhấc lên về phía người xem (to hơn, bóng loang rộng ra)
    .to(o.env, { y: -30, scale: 1.1, rotation: -5, duration: 0.8, ease: 'power2.out' }, 'lift')
    .to(o.envShadow, { autoAlpha: 0.28, y: 28, scale: 1.1, duration: 0.8, ease: 'power2.out' }, 'lift')
    .call(() => onStep('pan'), [], 'lift+=0.3') // → FEMALE_SCENE_TRANSITION

  const W = stageR.width, H = stageR.height
  tl.addLabel('gust', 'lift+=0.35')
  o.flurry.forEach((p, i) => {
    const near = p.classList.contains('is-near'), far = p.classList.contains('is-far')
    const speed = near ? 1.25 : far ? 2.1 : 1.65 // gần máy quay bay nhanh hơn
    const t0 = (i / o.flurry.length) * 0.9
    const pw = p.getBoundingClientRect().width || W * 0.12
    tl.fromTo(p,
      { autoAlpha: 1, x: -pw - W * 0.15, y: 0, rotation: (i * 57) % 360, scale: near ? 1.5 : far ? 0.7 : 1 },
      { x: W * 1.15, y: ((i % 5) - 2) * H * 0.05, rotation: `+=${near ? 260 : 420}`, duration: speed, ease: 'power1.inOut' }, `gust+=${t0}`)
      .to(p, { yPercent: i % 2 ? 60 : -60, duration: speed / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, `gust+=${t0}`)
  })
  tl
    // mép gió chạy qua màn hình, cảnh cũ bị cuốn đi, bàn tĩnh vật lộ ra (đã bày sẵn)
    .to([...o.sceneA, o.frontPlate], { '--wipe': '130%', duration: 1.9, ease: 'power1.inOut' }, 'gust+=0.15')
    // phong bì chao theo gió
    .to(o.env, { rotation: 4, x: 10, y: -40, duration: 0.9, ease: 'sine.inOut' }, 'gust')
    .to(o.env, { rotation: -2, x: 0, y: -26, duration: 0.9, ease: 'sine.inOut' }, 'gust+=0.9')
    // camera lùi nhẹ về, cảnh mới "mở ra"
    .to(o.sceneB, { scale: 1, duration: 2.6, ease: 'power3.out' }, 'gust+=0.2')
    .call(() => onStep('ready'), [], 'gust+=2.1') // → FEMALE_SCENE_READY
    // gió qua hẳn: cảnh cũ đã khuất → ẩn hẳn rồi mới gỡ mặt nạ (khỏi tốn công vẽ mặt nạ mỗi khung)
    .set(o.sceneA, { autoAlpha: 0 }, 'gust+=2.2')
    .set([...o.sceneA, o.frontPlate], { clearProps: 'maskImage,webkitMaskImage' }, 'gust+=2.2')

  // ---------- 7. phong bì đáp xuống, luồn dưới bó hoa ----------
  tl.addLabel('land', 'gust+=1.5')
    .to(o.env, { x: Tc.x - Ec.x, y: Tc.y - Ec.y, scale: T.width / E.width, rotation: -4, duration: 1.5, ease: 'power3.inOut' }, 'land')
    .to(o.envShadow, { autoAlpha: 0.55, x: 5, y: 8, scale: 1, duration: 1.5, ease: 'power3.inOut' }, 'land')
    .fromTo(o.light, { autoAlpha: 0, xPercent: -35 }, { autoAlpha: 1, xPercent: 0, duration: 1.8, ease: 'power2.out' }, 'land+=0.6')
    .fromTo(o.cta, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.ui }, 'land+=1.5')
    .call(() => onStep('waiting'), [], 'land+=1.8') // → FEMALE_WAITING_TAP

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
