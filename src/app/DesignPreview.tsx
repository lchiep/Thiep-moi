import { COPY, MOCK_GUEST } from '../config/copy'
import { EVENT } from '../config/event'
import './design-preview.css'

/**
 * Trang xem thử bộ màu / chữ / khoảng cách (Phase 2).
 * Tạm thời — sẽ bị thay bằng trải nghiệm thật ở Phase 3.
 */
const SCENES = [
  { id: 'call', name: '1 · Cuộc gọi', swatches: ['#0e0d0b', '#322c25', '#b48c69', '#37040a', '#56c55a', '#a49586'] },
  { id: 'rsvp', name: '2 · Popup', swatches: ['#faf1e1', '#e8ded1', '#959293', '#2a271a', '#fda0b5', '#7db2d7'] },
  { id: 'male', name: '3 · Nhánh Nam', swatches: ['#0d0d0a', '#1e1a14', '#a88d71', '#eddcc5'] },
  { id: 'female', name: '4 · Nhánh Nữ', swatches: ['#ebdacd', '#c7c4c0', '#e4d6c4', '#e56f7e', '#731b28', '#635e2d'] },
  { id: 'invitation', name: '5 · Thiệp', swatches: ['#f3eee8', '#220709', '#b19c75', '#030300'] },
] as const

export default function DesignPreview() {
  const h = COPY.invitationHeader
  return (
    <div className="dp">
      <header className="dp-head" data-scene="call">
        <p className="t-caps dp-muted">Phase 2 · Design system</p>
        <h1 className="t-title dp-h1">{EVENT.name}</h1>
        <p className="dp-muted">Màu đo từ ảnh mẫu · Luxurious Script + Cormorant Garamond</p>
      </header>

      <section className="dp-block">
        <h2 className="t-caps dp-label">Bảng màu theo cảnh</h2>
        {SCENES.map((s) => (
          <div key={s.id} className="dp-scene" data-scene={s.id}>
            <span className="dp-scene-name">{s.name}</span>
            <div className="dp-swatches">
              {s.swatches.map((c) => (
                <span key={c} className="dp-swatch" style={{ background: c }} title={c} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="dp-block">
        <h2 className="t-caps dp-label">Chữ</h2>
        <div className="dp-type paper">
          <p className="t-script dp-hero">Graduation Party</p>
          <p className="t-script dp-name">{MOCK_GUEST.nickname}</p>
          <p className="t-script dp-name-sm">Hoàng Đức · Nguyễn Ngọc Ánh</p>
          <p className="t-title dp-h1-ink">LỄ VINH DANH</p>
          <p className="t-caps dp-gold">{h.guestLabel}</p>
          <p className="dp-body">{COPY.sections.letter.body[0]}</p>
          <p className="t-ui dp-ui">Inter — form, nút, đồng hồ 08:00</p>
        </div>
      </section>

      <section className="dp-block">
        <h2 className="t-caps dp-label">Khung màn thiệp · 36% cố định / 64% cuộn</h2>
        <div className="dp-phone" data-scene="invitation">
          <div className="dp-inv-head">
            <span className="dp-seal" aria-hidden />
            <p className="t-caps">{h.kicker}</p>
            <p className="t-title">{h.title}</p>
            <p className="t-title dp-sub">{h.subtitle}</p>
            <p className="t-caps dp-gold">{h.guestLabel}</p>
            <p className="t-script dp-inv-name">{MOCK_GUEST.nickname}</p>
          </div>
          <div className="dp-inv-body">
            {Object.entries(COPY.sections).map(([key, s]) => (
              <div key={key} className="dp-inv-sec">
                <span className="t-caps">
                  {s.no} — {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dp-block">
        <h2 className="t-caps dp-label">Popup kính sáng · nút theo trạng thái</h2>
        <div className="dp-glass-wrap" data-scene="rsvp">
          <div className="glass dp-glass">
            <label className="dp-field glass-inset">
              <span className="t-caps">Biệt danh ở nhà</span>
              <input defaultValue={MOCK_GUEST.nickname} />
            </label>
            <div className="dp-btns">
              <button className="dp-btn is-cancel">HỦY BỎ</button>
              <button className="dp-btn is-submit">GỬI THÔNG TIN</button>
            </div>
            <div className="dp-btns">
              <button className="dp-btn" disabled>HỦY BỎ</button>
              <button className="dp-btn" disabled>GỬI THÔNG TIN</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
