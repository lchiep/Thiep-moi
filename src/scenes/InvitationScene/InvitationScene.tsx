import { forwardRef, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { HEAD, HEAD_COLOR, fitFs } from './inviteHeader'
import { COPY } from '../../config/copy'
import { animate } from 'animejs'
import { nudgeShake } from '../../animations/anime/microInteractions'
import { EVENT, eventStart } from '../../config/event'
import MapPreview from './MapPreview'
import RsvpNote from '../../components/RsvpNote/RsvpNote'
import { rsvpNoteFor } from '../../config/rsvpNote'
import { useGuest } from '../../state/guestStore'
import { sectionsFor, type Sections } from '../../state/guestStore'
import './InvitationScene.css'

/**
 * MÀN THIỆP (theo mẫu Hiệp gửi): nền nhung đỏ đô + tờ giấy dó có nhành lá vàng,
 * dấu sáp chữ H trên đầu.
 *  - HEADER cố định (phần giấy phía trên khung lá): kính mời · LỄ VINH DANH ·
 *    GRADUATION GALA 2026 · tên khách (thư pháp, hiện từng chữ)
 *  - NỘI DUNG cuộn độc lập bên trong khung lá: 5 mục theo thứ tự đã chốt.
 */
type Props = {
  /** họ và tên đầy đủ (dòng vàng in hoa) */
  fullName: string
  /** "Anh Hiệp" / "Chị Linh" (dòng thư pháp) */
  address: string
  active?: boolean
  /** "← Quay lại" về tập hồ sơ */
  onBack?: () => void
}

const InvitationScene = forwardRef<HTMLDivElement, Props>(function InvitationScene({ fullName, address, active, onBack }, ref) {
  // chữ trong thư theo khách (luật riêng: họ tên có "Hằng" → xưng anh – bé)
  const relationship = useGuest((g) => g.guest?.relationship)
  const S = useMemo(() => sectionsFor({ fullName, relationship }), [fullName, relationship])
  const scroller = useRef<HTMLDivElement>(null)
  useCardFocus(scroller)

  return (
    <section className="inv" data-scene="invitation" ref={ref} aria-label="Thiệp mời">
      {/* nền nhung đỏ đô: hiện dần quanh tờ thiệp khi camera đã zoom tới */}
      <div className="inv__bg" aria-hidden />
      {/* góc trái dưới, trên nền nhung: quay lại tập hồ sơ */}
      {onBack && (
        <button type="button" className="inv__back" onClick={onBack} disabled={!active}>
          {COPY.invitationHeader.back}
        </button>
      )}
      <div className="inv__paper">
        <img className="inv__seal" src="/assets/invitation/seal.webp" alt="" aria-hidden />

        {/* ---------- HEADER cố định ---------- */}
        <header className="inv__head">
          <p className="inv__line" style={line(HEAD.kicker, HEAD_COLOR.ink)}>
            <span className="inv__cap" style={{ fontSize: fsz(HEAD.kicker.cap) }}>C</span>HÂN THÀNH KÍNH MỜI
          </p>
          <h1 className="inv__line" style={line(HEAD.title, HEAD_COLOR.ink)}>{COPY.invitationHeader.title}</h1>
          <p className="inv__line" style={line(HEAD.subtitle, HEAD_COLOR.ink)}>{COPY.invitationHeader.subtitle}</p>
          <p className="inv__line" style={line(HEAD.label, HEAD_COLOR.gold)}>{COPY.invitationHeader.guestLabel}</p>
          <p className="inv__line" style={{ ...line(HEAD.fullName, HEAD_COLOR.gold), fontSize: fsz(fitFs(fullName, HEAD.fullName.fs)) }}>{fullName.toLocaleUpperCase('vi')}</p>
          <p className="inv__line inv__name" style={line(HEAD.name, HEAD_COLOR.gold)}>{address}</p>
        </header>

        {/* ---------- NỘI DUNG: 5 "trang", mỗi lần chỉ 1 trang trong khung lá ---------- */}
        <div className="inv__scroll" ref={scroller}>
          <Page no={S.letter.no} title={S.letter.title} heading={S.letter.heading} note={S.letter.note} hint>
            {S.letter.body.map((p, i) => <p key={i} className="inv__body">{p}</p>)}
          </Page>

          <Page no={S.timePlace.no} title={S.timePlace.title} heading={S.timePlace.heading} note={S.timePlace.note}>
            <p className="inv__label">{S.timePlace.timeLabel}</p>
            <Row icon={<ISun />}>{S.timePlace.time}</Row>
            <p className="inv__label">{S.timePlace.placeLabel}</p>
            <Row icon={<IPin />}>
              <b>{EVENT.hall}</b> — {EVENT.venueVi}
              <br />
              <span className="inv__muted">{EVENT.addressVi}</span>
            </Row>
            <p className="inv__label">{S.timePlace.greeterLabel}</p>
            {/* 1 dòng: [người] Cung Hiệp - [điện thoại] 0985… (icon nét vẽ; chạm số để gọi) */}
            <p className="inv__greeter">
              <IUser /> <b>{EVENT.greeter}</b> <i aria-hidden>-</i> <IPhone />
              <a className="inv__tel" href={`tel:${EVENT.contact.replace(/[^\d+]/g, '')}`}>{EVENT.contact}</a>
            </p>
          </Page>

          <Page no={S.schedule.no} title={S.schedule.title} heading={S.schedule.heading} note={S.schedule.note}>
            <Countdown />
            <MapPreview />
            <a className="inv__btn inv__btn--sm" href={EVENT.mapsUrl} target="_blank" rel="noopener noreferrer">
              <IMap />
              {S.schedule.mapButton}
            </a>
          </Page>

          <Page no={S.guide.no} title={S.guide.title} heading={S.guide.heading} note={S.guide.note}>
            <p className="inv__body">{S.guide.intro}</p>
            <GuideItem label={S.guide.dress.label} icon={<IShirt />}>
              <span className="inv__swatches">
                {S.guide.dress.colors.map((c, i) => (
                  <span key={c.name} className="inv__swatch">
                    {i > 0 && <i aria-hidden>·</i>}
                    <span className="inv__chip" style={{ background: c.hex }} aria-hidden />
                    {c.name}
                  </span>
                ))}
              </span>
              <span className="inv__sub">{S.guide.dress.text}</span>
            </GuideItem>
            <GuideItem label={S.guide.photo.label} icon={<ICamera />}>{S.guide.photo.text}</GuideItem>
          </Page>

          <Page no={S.rsvp.no} title={S.rsvp.title} end={S.rsvp.end}>
            <h2 className="inv__script">{S.rsvp.heading}</h2>
            <RsvpAndWish S={S.rsvp} />
          </Page>
        </div>
      </div>
    </section>
  )
})
export default InvitationScene

/**
 * Cỡ chữ header theo bề ngang, nhưng không vượt tỉ lệ chiều cao của máy chuẩn 390×844
 * → máy màn thấp (375×667) chữ tự nhỏ lại, các dòng không đè nhau.
 */
const fsz = (fs: number) => `min(${fs}cqw, ${(fs * 390) / 844}cqh)`

/** Một dòng header đặt tuyệt đối theo % tờ giấy (chân chữ ở y). */
function line(h: { y: number; fs: number; weight: number; spacing: number }, color: string): CSSProperties {
  return {
    top: `${h.y * 100}%`,
    fontSize: fsz(h.fs),
    fontWeight: h.weight,
    letterSpacing: `${h.spacing}em`,
    color,
  }
}

/**
 * Cuộn như lật trang: mỗi mục cao bằng khung, scroll-snap (stop: always) dừng đúng
 * từng trang. Trang đang rời đi mờ + lùi nhẹ, trang tới hiện dần (rAF, không setState).
 */
function useCardFocus(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const paint = () => {
      raf = 0
      const top = el.scrollTop
      const h = el.clientHeight
      const mid = top + h / 2
      el.querySelectorAll<HTMLElement>('.inv__sec').forEach((c) => {
        // khoảng cách từ giữa khung tới trang (0 khi giữa khung nằm trong trang — kể cả trang dài đang đọc dở)
        const a = c.offsetTop, b = a + c.offsetHeight // offsetParent = khung cuộn
        const d = mid < a ? a - mid : mid > b ? mid - b : 0
        const k = Math.min(1, d / (h / 2))
        c.style.opacity = String(1 - k * 0.9)
        if (!reduce) c.style.transform = `scale(${1 - k * 0.05})`
      })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint) }
    paint()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [ref])
}

/** Một "trang" nội dung: cao đúng bằng khung cuộn → mỗi lần chỉ thấy 1 trang. */
const SWIPE_HINT = 'Vuốt lên để xem tiếp'

function Page({ no, title, heading, note, end, hint, children }: {
  no: string; title: string; heading?: string; note?: string; end?: string; hint?: boolean; children: ReactNode
}) {
  const arrow = useRef<HTMLSpanElement>(null)
  // mũi tên nhích lên nhè nhẹ (Anime.js — chỉ phần tử con nhỏ, không đụng transform của trang)
  useEffect(() => {
    if (!hint || !arrow.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const a = animate(arrow.current, { translateY: [2, -3], duration: 900, ease: 'inOutSine', loop: true, alternate: true })
    return () => { a.revert() }
  }, [hint])
  return (
    <section className="inv__sec" aria-label={title} data-no={no}>
      {/* chỉ giữ tiêu đề viết tay đỏ đô (bỏ dòng "01 — …" theo ý Hiệp) */}
      {heading && <h2 className="inv__script">{heading}</h2>}
      {children}
      {note && <p className="inv__note"><span aria-hidden>❦</span>{note}</p>}
      {end && <p className="inv__end">{end}</p>}
      {hint && <p className="inv__swipe"><span ref={arrow} aria-hidden>↑</span>{SWIPE_HINT}</p>}
      {/* điểm dừng ở ĐÁY trang: trang dài hơn khung (vd. Hướng dẫn khách mời) đọc được tới dòng cuối, không bị bật lên đầu trang */}
      <i className="inv__snapend" aria-hidden />
    </section>
  )
}
function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="inv__row">
      {icon}
      <span>{children}</span>
    </p>
  )
}
function GuideItem({ no, label, icon, children }: { no?: string; label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="inv__guide">
      <p className="inv__label">{no && <span>{no} · </span>}{label}</p>
      <p className="inv__row">
        {icon}
        <span className="inv__col">{children}</span>
      </p>
    </div>
  )
}

/** Tháng · ngày · giờ · phút · giây còn lại (tháng tính theo lịch). */
function remaining(from: Date, to: Date) {
  if (to <= from) return [0, 0, 0, 0, 0]
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  const plus = (m: number) => { const d = new Date(from); d.setMonth(d.getMonth() + m); return d }
  if (plus(months) > to) months--
  let ms = to.getTime() - plus(months).getTime()
  const days = Math.floor(ms / 86400000); ms -= days * 86400000
  const hrs = Math.floor(ms / 3600000); ms -= hrs * 3600000
  const mins = Math.floor(ms / 60000); ms -= mins * 60000
  return [months, days, hrs, mins, Math.floor(ms / 1000)]
}

/* ---------- đếm ngược: mũ cử nhân 3D lơ lửng + số lớn (cập nhật 1 lần/giây, dọn interval khi rời) ---------- */
function Countdown() {
  const units = COPY.sections.schedule.units
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const parts = remaining(now, eventStart())
  return (
    <div className="inv__count" role="timer" aria-label="Đếm ngược tới buổi lễ">
      <img className="inv__cap3d" src="/assets/invitation/grad-cap.webp" alt="" aria-hidden />
      <div className="inv__digits">
        {parts.map((v, i) => (
          <div key={units[i]} className="inv__cell">
            <span className="inv__num">{String(v).padStart(2, '0')}{i < 4 && <i aria-hidden>:</i>}</span>
            <span className="inv__unit">{units[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- xác nhận tham dự + lời nhắn bên dưới (Phase 12: submit_rsvp / submit_wish; tạm lưu trên máy) ---------- */
function RsvpAndWish({ S }: { S: Sections['rsvp'] }) {
  const [pick, setPick] = useState<string>('')
  const [sent, setSent] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const guest = useGuest((g) => g.guest)
  const note = rsvpNoteFor(guest)
  return (
    <>
      {noteOpen && note && <RsvpNote note={note} onClose={() => setNoteOpen(false)} />}
      {sent ? (
        <div className="inv__thanks" role="status">
          <p className="inv__script">{S.thanks}</p>
          <p className="inv__body">{S.thanksSub}</p>
        </div>
      ) : (
        <form
          className="inv__rsvp"
          onSubmit={(e) => {
            e.preventDefault()
            if (!pick) return
            try { localStorage.setItem('gg26.rsvp', pick) } catch { /* bỏ qua */ }
            setSent(true)
            // tham dự / sẽ thu xếp → hiện tờ giấy nhắn nhỏ (nhóm nào có bản riêng thì dùng bản đó); "không đi được" thì không
            if (pick !== 'not_attending' && note) setNoteOpen(true)
          }}
        >
          <p className="inv__body">{S.intro}</p>
          <p className="inv__q">{S.question}</p>
          <div role="radiogroup" aria-label={S.title}>
            {S.options.map((o, i) => (
              <label key={o.value} className={`inv__opt ${pick === o.value ? 'is-on' : ''}`}>
                <input type="radio" name="rsvp" value={o.value} checked={pick === o.value} onChange={() => setPick(o.value)} />
                <span className="inv__radio" aria-hidden>{'①②③'[i]}</span>
                <span className="inv__col">
                  {o.label}
                  {pick === o.value && <span className="inv__reply">{o.reply}</span>}
                </span>
              </label>
            ))}
          </div>
          <button type="submit" className="inv__btn is-solid" disabled={!pick}>{S.button}</button>
        </form>
      )}
      {/* lời nhắn nằm DƯỚI phần hỏi; chọn "Không đi được" → nút lắc nhẹ gợi ý gửi lời nhắn */}
      <Wish S={S} nudge={pick === 'not_attending'} />
    </>
  )
}

function Wish({ S, nudge }: { S: Sections['rsvp']; nudge: boolean }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const empty = !text.trim()

  // nút lắc nhẹ (Anime.js) khi được gợi ý và ô viết đang đóng
  useEffect(() => {
    if (!nudge || open || !wrap.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const scope = nudgeShake(wrap.current)
    return () => scope.revert()
  }, [nudge, open])

  // mở ô viết mà chưa viết gì rồi lướt đi chỗ khác → tự thu về nút "Gửi lời chúc"
  useEffect(() => {
    if (!open || !empty || !form.current) return
    const root = form.current.closest('.inv__scroll')
    const io = new IntersectionObserver(([en]) => { if (!en.isIntersecting) setOpen(false) }, { root, threshold: 0 })
    io.observe(form.current)
    return () => io.disconnect()
  }, [open, empty])

  if (!open)
    return (
      <div className="inv__nudge" ref={wrap}>
        <button type="button" className="inv__btn" onClick={() => setOpen(true)}>
          <IHeartMail />
          {S.wishButton}
        </button>
      </div>
    )
  return (
    <form
      ref={form}
      className="inv__wish"
      onSubmit={(e) => {
        e.preventDefault()
        if (empty) return
        try { localStorage.setItem('gg26.wish', text.trim()) } catch { /* bỏ qua */ }
        setSent(true)
      }}
    >
      <textarea rows={3} autoFocus value={text} onChange={(e) => { setText(e.target.value); setSent(false) }} placeholder={S.wishPlaceholder} maxLength={500} />
      <button type="submit" className={`inv__btn ${sent ? 'is-done' : ''}`} disabled={empty}>
        {sent ? S.wishDone : S.wishSend}
      </button>
    </form>
  )
}

/* ---------- icon nét mảnh (thay emoji) ---------- */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const IPin = () => (<svg viewBox="0 0 24 24" {...P}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>)
const IUser = () => (<svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20c.9-3.7 3.7-5.6 7.2-5.6s6.3 1.9 7.2 5.6" /></svg>)
const IPhone = () => (<svg viewBox="0 0 24 24" {...P}><path d="M6.5 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" /></svg>)
const ISun = () => (<svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="3.8" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" /></svg>)
const IMap = () => (<svg viewBox="0 0 24 24" {...P}><path d="M3.5 6.5 9 4l6 2.5 5.5-2.5v13.5L15 20l-6-2.5-5.5 2.5z" /><path d="M9 4v13.5M15 6.5V20" /></svg>)
const IShirt = () => (<svg viewBox="0 0 24 24" {...P}><path d="M9 3.5 4 6l1.5 4.5L7.5 10v10.5h9V10l2 .5L20 6l-5-2.5a3 3 0 0 1-6 0z" /></svg>)
const ICamera = () => (<svg viewBox="0 0 24 24" {...P}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.5-2h5.4l1.5 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="12.8" r="3.4" /></svg>)
const IHeartMail = () => (<svg viewBox="0 0 24 24" {...P}><rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="m3.5 7 8.5 6.5L20.5 7" /><path d="M12 11.2c-.9-1.3-2.9-.7-2.5.9.3 1 2.5 2.4 2.5 2.4s2.2-1.4 2.5-2.4c.4-1.6-1.6-2.2-2.5-.9z" /></svg>)
