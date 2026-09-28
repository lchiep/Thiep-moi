import { gsap } from 'gsap'
import { LETTER_RATIO } from '../../scenes/FemaleScene/femaleAssets'

/**
 * NHÁNH NỮ — sau khi phong bì mở (Hiệp 29/09):
 *   chạm / vuốt lên → VÉ bay ra khỏi phong bì, xoay dọc, phóng to giữa màn (y như màn xem vé nhánh Nam),
 *                     THƯ trượt hẳn ra khỏi túi rồi nằm phía sau vé; nền mờ đi
 *   vuốt lên lần nữa → ĐẢO BÀI: lá phía trước trượt xuống, vòng ra sau; lá phía sau tiến lên trước (lặp lại được)
 *   vuốt xuống → cất cả hai vào phong bì (tua ngược).
 * Mỗi lá là 1 khối DOM (.fem__deck-ticket / .fem__deck-letter) phủ trên phong bì; GSAP giữ x/y/rotation/scale/opacity/zIndex.
 * Vị trí đo từ getBoundingClientRect (không hard-code pixel).
 */
const TICKET_R = 635 / 1608 // cao / dài của vé ngang

type Pose = { x: number; y: number; rotation: number; scale: number }

export type DeckRefs = {
  stage: HTMLElement
  env: HTMLElement
  ticketIn: HTMLElement // vé đang nằm trong phong bì
  letterIn: HTMLElement // thư đang nằm trong phong bì
  ticket: HTMLElement // lá vé lớn (khối ngang, xoay 90° khi đứng trước)
  letter: HTMLElement // lá thư lớn
  veil: HTMLElement
}

/** Bố cục bộ bài theo cỡ màn hiện tại. Mỗi khối đặt left/top/width/height 1 lần (khung gốc = lúc đứng trước). */
export function layoutDeck(o: DeckRefs) {
  const S = o.stage.getBoundingClientRect()
  // vé đứng trước: dọc, gần kín chiều cao (chừa đỉnh cho gợi ý cất, đáy cho gợi ý vuốt)
  const L = Math.min(S.height * 0.86, (S.width * 0.94) / TICKET_R) // Hiệp: vé to hơn (≈ 86% chiều cao màn)
  const tW = L, tH = L * TICKET_R
  const tC = { x: S.width / 2, y: S.height * 0.48 }
  // thư đứng trước: NGUYÊN tờ thiệp dọc (như nhánh Nam), cao ≈ bằng vé
  const lH = Math.min(S.height * 0.86, S.width * 0.92 * LETTER_RATIO), lW = lH / LETTER_RATIO
  const lC = { x: S.width / 2, y: S.height * 0.48 }
  gsap.set(o.ticket, { left: tC.x - tW / 2, top: tC.y - tH / 2, width: tW, height: tH, transformOrigin: '50% 50%' })
  gsap.set(o.letter, { left: lC.x - lW / 2, top: lC.y - lH / 2, width: lW, height: lH, transformOrigin: '50% 50%' })
  const P = {
    ticketFront: { x: 0, y: 0, rotation: 90, scale: 1 },
    // lá nằm sau: nhỏ lại chút, chéo nhẹ, lệch sang 1 bên → ló mép ra như xấp bài
    ticketBack: { x: -S.width * 0.08, y: S.height * 0.005, rotation: 84, scale: 0.9 },
    letterFront: { x: 0, y: 0, rotation: 0, scale: 1 },
    letterBack: { x: S.width * 0.08, y: -S.height * 0.005, rotation: 6, scale: 0.9 },
  }
  return { S, P, tC, lC, tW, lW }
}

/** Khối lớn đặt đúng chỗ + đúng cỡ của lá đang nằm trong phong bì (để thay vai không bị nhảy). */
function poseFromInside(inside: HTMLElement, env: HTMLElement, S: DOMRect, center: { x: number; y: number }, baseW: number): Pose {
  const r = inside.getBoundingClientRect() // hộp bao (đã xoay) — tâm vẫn đúng
  const envScale = gsap.getProperty(env, 'scale') as number
  return {
    x: r.left + r.width / 2 - S.left - center.x,
    y: r.top + r.height / 2 - S.top - center.y,
    rotation: (gsap.getProperty(inside, 'rotation') as number) + (gsap.getProperty(env, 'rotation') as number),
    scale: (inside.offsetWidth * envScale) / baseW,
  }
}

/** Rút vé (ra trước) + thư (ra sau) khỏi phong bì. */
export function deckRevealTimeline(o: DeckRefs) {
  const { S, P, tC, lC, tW, lW } = layoutDeck(o)
  const tFrom = poseFromInside(o.ticketIn, o.env, S, tC, tW)
  const tl = gsap.timeline()
  // 1. VÉ: thay vai tại chỗ → bay lên giữa màn, xoay dọc, to dần (nối tiếp, không khựng)
  tl.addLabel('ticket', 0)
    .set(o.ticket, { ...tFrom, autoAlpha: 1, zIndex: 43 }, 'ticket')
    .set(o.ticketIn, { autoAlpha: 0 }, 'ticket')
    .to(o.ticket, { ...P.ticketFront, duration: 1.05, ease: 'power3.inOut' }, 'ticket')
  // 2. THƯ (cả tờ thiệp dọc): rút hẳn lên khỏi phong bì — thư đi lên, phong bì hạ xuống (như tay kéo thư ra)
  //    vẫn nằm trong phong bì nên túi trước che đúng; ra hết rồi mới thay vai sang lá lớn và lùi ra sau vé
  const Lr = o.letterIn.getBoundingClientRect()
  const Er = o.env.getBoundingClientRect()
  const pull = Lr.bottom - Er.top + 10 // quãng cần kéo để đáy thư lên khỏi miệng phong bì
  const letterScreenH = o.letterIn.offsetHeight * (gsap.getProperty(o.env, 'scale') as number)
  const up = pull * 0.45
  tl.addLabel('letterOut', 'ticket+=0.2')
    .to(o.letterIn, { yPercent: `-=${(up / letterScreenH) * 100}`, duration: 0.85, ease: 'power2.inOut' }, 'letterOut')
    .to(o.env, { y: `+=${pull - up}`, duration: 0.85, ease: 'power2.inOut' }, 'letterOut')
  tl.addLabel('letter', 'letterOut+=0.85')
    // chỗ + cỡ đo ĐÚNG lúc thay vai (thư vừa ra khỏi túi); hiện/ẩn là .set của timeline → tua ngược tự ẩn lại
    .add(() => { gsap.set(o.letter, poseFromInside(o.letterIn, o.env, S, lC, lW)) }, 'letter')
    .set(o.letter, { autoAlpha: 1, zIndex: 42 }, 'letter')
    .set(o.letterIn, { autoAlpha: 0 }, 'letter')
    .to(o.letter, { ...P.letterBack, duration: 0.8, ease: 'power3.out' }, 'letter+=0.01')
  // 3. nền (phong bì, bó hoa…) mờ đi phía sau — chỉ khi thư đã rời phong bì
  tl.to(o.veil, { autoAlpha: 1, duration: 0.6, ease: 'sine.out' }, 'letter')
  return tl
}

/**
 * ĐẢO BÀI: lá trước trượt xuống (hơi xoay), chui ra sau; lá sau tiến lên trước.
 * toLetter = true: vé đang trước → thư lên trước.
 */
export function deckShuffleTimeline(o: DeckRefs, toLetter: boolean) {
  const { P } = layoutDeck(o)
  const [front, back] = toLetter ? [o.ticket, o.letter] : [o.letter, o.ticket]
  const frontGoesTo = toLetter ? P.ticketBack : P.letterBack
  const backComesTo = toLetter ? P.letterFront : P.ticketFront
  const cur = {
    x: gsap.getProperty(front, 'x') as number, y: gsap.getProperty(front, 'y') as number,
    r: gsap.getProperty(front, 'rotation') as number, s: gsap.getProperty(front, 'scale') as number,
  }
  const S = o.stage.getBoundingClientRect()
  // Hiệp: đảo bài CHẬM thôi
  return gsap
    .timeline()
    .addLabel('out', 0)
    // lá trước: trượt xuống + lệch phải, xoay thêm chút (như rút lá bài ra khỏi xấp)
    .to(front, { x: cur.x + S.width * 0.2, y: cur.y + S.height * 0.34, rotation: cur.r + 10, scale: cur.s * 0.92, duration: 0.75, ease: 'power2.inOut' }, 'out')
    // lá sau: bắt đầu tiến lên (vẫn ở dưới)
    .to(back, { ...backComesTo, duration: 1.35, ease: 'power2.inOut' }, 'out+=0.2')
    // lá trước đã ra khỏi xấp → chui ra sau
    .set(front, { zIndex: 42 }, 'out+=0.75')
    .set(back, { zIndex: 43 }, 'out+=0.75')
    .to(front, { ...frontGoesTo, duration: 1.0, ease: 'power2.out' }, 'out+=0.75')
}
