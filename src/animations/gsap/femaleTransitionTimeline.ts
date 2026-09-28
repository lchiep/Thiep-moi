import { gsap } from 'gsap'
import { EASE } from '../motion'
import { lightParticlesTween } from './lightParticles'
import { ENVELOPE_TILT } from '../../scenes/FemaleScene/femaleAssets'

/**
 * NHÁNH NỮ — từ lúc bấm GỬI tới khi cảnh tulip chờ khách chạm vào thư.
 *
 *   phong bì mở trồi lên từ mép dưới · popup TAN thành hàng trăm HẠT SÁNG (canvas, hoà màu 'lighter')
 *   → hạt xoáy cong bay vào miệng phong bì, trong túi ấm sáng lên, lá thư "đọng" lại bên trong
 *   → nắp gập xuống quanh nếp gấp (mặt ngoài có dấu sáp ở mũi nắp) → phong bì nhún, đốm sáng quanh dấu sáp
 *   → CƠN GIÓ CÁNH HOA: phong bì được nhấc lên, một đợt cánh tulip cuộn từ trái sang phải (gần–xa, nhoè
 *     theo chiều sâu); mép đợt gió "cuốn" cảnh cuộc gọi đi (mặt nạ mềm chạy theo), để lộ sẵn bàn tĩnh vật:
 *     lụa + bó hoa + KitKat đã nằm đó
 *   → phong bì chao xuống, luồn dưới bó hoa; bóng hoa + vệt nắng cửa sổ đổ lên phong bì · "CHẠM VÀO THƯ ĐỂ MỞ"
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
  sparks: HTMLCanvasElement // canvas hạt sáng
  envGlow: HTMLElement // ánh sáng ấm trong túi phong bì
  envSun: HTMLElement // vệt nắng cửa sổ phủ lên phong bì (khi đã nằm trong cảnh tulip)
  plateRef: HTMLElement // "tấm ảnh" cảnh tulip — để canh vệt nắng trên phong bì khớp nền
  onSeal: () => void // dấu sáp vừa ấn: đốm sáng (Anime.js)
  env: HTMLElement // phong bì: vị trí/xoay/scale
  envFloat: HTMLElement // lớp trong: nhún khi thư chạm đáy / khi nắp đóng
  envShadow: HTMLElement
  envLetter: HTMLElement // lá thư trong túi phong bì (giữa thân sau và thân trước)
  envInner: HTMLElement[] // thân E2 + giấy + ánh sáng trong túi (ẩn khi đã đóng)
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

/** Canh ảnh vệt nắng (phủ cả tấm ảnh cảnh tulip) vào hệ toạ độ riêng của phong bì đã đáp (đã thu nhỏ). */
function sunOn(P: DOMRect, T: DOMRect, envW: number) {
  const s = T.width / envW // phong bì đáp xuống bị thu theo tỉ lệ này
  return {
    backgroundSize: `${P.width / s}px ${P.height / s}px`,
    backgroundPosition: `${(P.left - T.left) / s}px ${(P.top - T.top) / s}px`,
  }
}

export function femaleTransitionTimeline(o: FemaleRefs, onStep: (step: FemaleStep) => void) {
  // ---------- đo khi mọi thứ còn ở vị trí gốc (chưa transform) ----------
  const stageR = o.stage.getBoundingClientRect()
  const E = o.env.getBoundingClientRect() // thân phong bì lúc nằm yên ở cảnh 1
  const T = o.spot.getBoundingClientRect() // chỗ phong bì đáp trong cảnh tulip
  const P = o.plateRef.getBoundingClientRect() // tấm ảnh cảnh tulip (để canh vệt nắng)
  const flapH = o.flap.getBoundingClientRect().height
  const Ec = center(E), Tc = center(T)
  // hạt sinh ra từ khung kính của popup (không phải cả màn)
  const popupR = (o.popup?.querySelector('.gp__shell') ?? o.popup)?.getBoundingClientRect() ?? new DOMRect(E.left, E.top - 300, E.width, 260)

  // ---------- trạng thái đầu ----------
  gsap.set(o.sceneA, { zIndex: (i) => 2 + i })
  gsap.set(o.sceneB, { scale: 1.05, transformOrigin: '50% 55%' })
  // mặt nạ mềm theo mép gió: cảnh cũ mất dần từ trái sang phải, lớp bó hoa hiện ra đúng theo mép đó
  const WIPE = { '--wipe': '-20%' }
  gsap.set(o.sceneA, { ...WIPE, maskImage: 'linear-gradient(90deg, transparent calc(var(--wipe) - 16%), #000 var(--wipe))', webkitMaskImage: 'linear-gradient(90deg, transparent calc(var(--wipe) - 16%), #000 var(--wipe))' })
  gsap.set(o.frontPlate, { ...WIPE, maskImage: 'linear-gradient(90deg, #000 calc(var(--wipe) - 16%), transparent var(--wipe))', webkitMaskImage: 'linear-gradient(90deg, #000 calc(var(--wipe) - 16%), transparent var(--wipe))' })
  gsap.set(o.flurry, { autoAlpha: 0 })
  // dưới mép màn: cộng cả chiều cao nắp đang mở (nắp nằm trên thân) để không ló mũi nắp
  gsap.set(o.env, { y: stageR.bottom - E.top + flapH + 30, rotation: 4, transformOrigin: '50% 50%' })
  gsap.set(o.envShadow, { autoAlpha: 0.55 })
  gsap.set([o.envLetter, o.envGlow, o.envClosed, o.envSun], { autoAlpha: 0 })
  gsap.set(o.flap, { rotationX: 0, transformPerspective: 900, transformOrigin: '50% 100%', zIndex: 0 })
  gsap.set([o.light, o.cta], { autoAlpha: 0 })

  const tl = gsap.timeline()

  // ---------- 1. popup TAN DẦN từ trên xuống dưới thành hạt sao vàng ----------
  const SWEEP = 2.0 // đường tan quét hết popup trong 2s
  tl.addLabel('dissolve', 0)
  if (o.popup) {
    const pr = o.popup.getBoundingClientRect()
    const cut0 = popupR.top - pr.top - 24, cut1 = popupR.bottom - pr.top + 24
    // phần phía trên đường tan trong suốt, mép tan mềm 28px
    const MASK = 'linear-gradient(180deg, transparent var(--cut), #000 calc(var(--cut) + 28px))'
    tl.set(o.popup, { '--cut': `${cut0}px`, maskImage: MASK, webkitMaskImage: MASK }, 'dissolve')
      .to(o.popup, { '--cut': `${cut1}px`, duration: SWEEP, ease: 'none' }, 'dissolve')
      .set(o.popup, { autoAlpha: 0 }, `dissolve+=${SWEEP}`)
  }
  tl.call(() => onStep('letter'), [], `dissolve+=${SWEEP}`) // → FEMALE_ENVELOPE_INSERT (popup đã tan hết)

  // ---------- 2. phong bì trồi lên đón hạt ----------
  tl.addLabel('rise', 'dissolve+=0.55') // để popup kịp tan một đoạn rồi phong bì mới trồi lên đón
    .to(o.env, { y: 0, rotation: 0, duration: 1.2, ease: 'power3.out' }, 'rise')

  // ---------- 3. hạt sao sinh ra đúng theo đường tan, xoáy vào miệng phong bì ----------
  const mouth = { x: Ec.x, y: E.top + E.height * 0.3, w: E.width * 0.55 }
  const sparks = lightParticlesTween({ canvas: o.sparks, from: popupR, to: mouth, stage: stageR, sweep: SWEEP })
  const END = sparks.duration()
  tl.add(sparks, 'dissolve')
    // túi phong bì ấm sáng dần khi hạt đổ vào, giấy thư đọng lại bên trong
    .to(o.envGlow, { autoAlpha: 1, duration: 1.0, ease: 'power1.in' }, 'dissolve+=1.0')
    .to(o.envLetter, { autoAlpha: 1, duration: 1.2, ease: 'power1.inOut' }, 'dissolve+=1.4')
    .to(o.envGlow, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }, `dissolve+=${END - 0.3}`)
    // phong bì hơi nhún khi đợt hạt cuối chạm đáy
    .to(o.envFloat, { y: 3, duration: 0.2, ease: 'power2.out' }, `dissolve+=${END - 0.3}`)
    .to(o.envFloat, { y: 0, duration: 0.4, ease: 'power2.inOut' }, `dissolve+=${END - 0.1}`)

  // ---------- 4. nắp gập xuống ----------
  tl.addLabel('close', `dissolve+=${END}`)
    .to(o.flap, { rotationX: -180, duration: 0.95, ease: 'power2.inOut' }, 'close')
    .set(o.flap, { zIndex: 5 }, 'close+=0.47') // qua 90° → nắp nằm TRÊN thân trước
    .to(o.envClosed, { autoAlpha: 1, duration: 0.22, ease: 'power1.in' }, 'close+=0.52')
    // thân E2 (phong bì mở) + giấy + ánh sáng bên dưới: cỡ ảnh khác E1 nên lộ mép như 1 lớp thừa → ẩn hẳn
    .set(o.envInner, { autoAlpha: 0 }, 'close+=0.8')
    .to(o.envFloat, { scale: 0.985, duration: 0.12, ease: 'power2.out' }, 'close+=0.92')
    .call(() => o.onSeal(), [], 'close+=0.95')
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
    .to(o.env, { x: Tc.x - Ec.x, y: Tc.y - Ec.y, scale: T.width / E.width, rotation: ENVELOPE_TILT, duration: 1.5, ease: 'power3.inOut' }, 'land')
    .to(o.envShadow, { autoAlpha: 0.55, x: 0, y: 0, scale: 1, duration: 1.5, ease: 'power3.inOut' }, 'land')
    // phong bì nằm vào vùng nắng: vệt nắng cửa sổ (cùng góc với vệt trên mặt đá) hiện dần trên giấy
    .set(o.envSun, sunOn(P, T, E.width), 'land')
    .to(o.envSun, { autoAlpha: 1, duration: 1.1, ease: 'power1.inOut' }, 'land+=0.9')
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
