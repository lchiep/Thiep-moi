import { forwardRef, useEffect, useMemo, useState, type ReactNode } from 'react'
import { IFemale, IHeart, IHome, IMail, IMale, IPen, IPhone, IUser } from './formIcons'
import { RELATIONSHIPS, type Relationship } from '../../config/relationship'
// IStar (icon Sở thích) bỏ import vì ô Sở thích đang tắt — bật lại ô thì thêm IStar vào dòng trên
import FormTour from './FormTour'
import PhotoPicker from './PhotoPicker'
import DateField from './DateField'
import { COPY } from '../../config/copy'
import { prepPhoto, specialGuest } from '../../state/guestStore'
import './GlassPopup.css'

export type Gender = 'nu' | 'nam'
export type GuestForm = {
  fullName: string
  nickname: string
  phone: string
  /** quan hệ với Hiệp → xưng hô trong thư ('' = chưa chọn) */
  relationship: Relationship | ''
  gender: Gender | ''
  email: string
  dob: string
  hobbies: string
  description: string
  photo: File | null
}

/**
 * DỮ LIỆU MẪU để test nhanh (chỉ khi `npm run dev`, bản build thật KHÔNG có):
 * form điền sẵn + bỏ qua lời chào/hướng dẫn → chỉ cần up ảnh rồi bấm GỬI.
 * Muốn tắt: thêm `?nomock` vào URL. Muốn thử nhánh Nữ: `?mock=nu`.
 */
const MOCK_ON = import.meta.env.DEV && !new URLSearchParams(location.search).has('nomock')
const MOCK_FORM = (): GuestForm => ({
  fullName: 'Nguyễn Thị Bích Hằng', nickname: 'Hằng', phone: '0912345678', relationship: 'ban',
  gender: new URLSearchParams(location.search).get('mock') === 'nu' ? 'nu' : 'nam',
  email: 'bichhang@gmail.com', dob: '2003-05-14', hobbies: '', description: 'Thích chụp ảnh ✨', photo: null,
})

const EMPTY: GuestForm = {
  fullName: '', nickname: '', phone: '', relationship: '', gender: '',
  email: '', dob: '', hobbies: '', description: '', photo: null,
}

/** Viết hoa chữ cái đầu mỗi từ, các chữ sau về thường: "BÍCh hằng" → "Bích Hằng". Giữ khoảng trắng khi đang gõ. */
export function titleCaseVi(v: string) {
  return v
    .toLocaleLowerCase('vi')
    .replace(/(^|\s)(\S)/g, (_, sp: string, ch: string) => sp + ch.toLocaleUpperCase('vi'))
}

/** Ô bắt buộc (Hiệp chốt 26/09): họ tên, tên gọi thân mật, SĐT, giới tính, email @gmail.com, ảnh. Trả về key ô (khớp data-tour). */
function missing(f: GuestForm) {
  const m: string[] = []
  if (!f.fullName.trim()) m.push('fullName')
  if (!f.nickname.trim()) m.push('nickname')
  if (!/^0\d{9}$/.test(f.phone.replace(/\s/g, ''))) m.push('phone')
  if (!f.relationship) m.push('relationship')
  if (!f.gender) m.push('gender')
  if (!/^[^\s@]+@gmail\.com$/i.test(f.email.trim())) m.push('email')
  if (!f.photo) m.push('photo')
  return m
}

type Props = {
  onCancel: () => void
  /** trả về câu báo lỗi (hiện dưới form) hoặc null nếu đi tiếp được */
  onSubmit: (data: GuestForm) => Promise<string | null>
  /** form đã đủ thông tin và đi nhánh Nam → cho cảnh 3D dựng sẵn ở nền (null = chưa đủ / không phải nhánh Nam) */
  onWarm?: (data: GuestForm | null) => void
  /** khách đã đăng ký: không hiện form, chỉ lời chào (tấm kính vẫn mọc ra rồi biến thành tài liệu / thư như thường) */
  returning?: { address: string; line: string } | null
}

const GlassPopup = forwardRef<HTMLDivElement, Props>(function GlassPopup({ onCancel, onSubmit, onWarm, returning }, ref) {
  const [f, setF] = useState<GuestForm>(() => (MOCK_ON ? MOCK_FORM() : EMPTY))
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  // lời nhắn trước khi điền: mỗi phiên chỉ hiện 1 lần
  // lời nhắn + hướng dẫn: hiện MỖI LẦN mở popup (khách tự bỏ qua nếu không muốn xem)
  const [intro, setIntro] = useState(!MOCK_ON && !returning)
  // bấm GỬI khi còn thiếu → hướng dẫn lần lượt từng ô còn thiếu/sai
  const [fix, setFix] = useState<string[] | null>(null)
  const endIntro = () => {
    setIntro(false)
  }
  const set = <K extends keyof GuestForm>(k: K, v: GuestForm[K]) => setF((p) => ({ ...p, [k]: v }))

  // luật riêng theo tên (vd. họ tên có "Hằng"): khoá giới tính → chỉ đi được nhánh Nữ
  const lockGender = specialGuest(f.fullName)?.lockGender as Gender | undefined
  useEffect(() => {
    if (lockGender && f.gender !== lockGender) setF((p) => ({ ...p, gender: lockGender }))
  }, [lockGender, f.gender])

  // nén ảnh + dò mặt sẵn trong nền ngay khi chọn ảnh (xem prepPhoto) → bấm GỬI là chạy hiệu ứng liền
  useEffect(() => { if (f.photo) void prepPhoto(f.photo).catch(() => {}) }, [f.photo])
  const photoUrl = useMemo(() => (f.photo ? URL.createObjectURL(f.photo) : ''), [f.photo])
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  const miss = missing(f)
  // dựng sẵn cảnh Nam SỚM: chỉ cần những gì hiện trên vé/thiệp (tên + ảnh + chọn Nam), không đợi điền hết form
  const toMale = !!f.fullName.trim() && !!f.photo && f.gender === 'nam' && specialGuest(f.fullName)?.lockGender !== 'nu'
  useEffect(() => { if (!returning) onWarm?.(toMale ? f : null) }, [f, toMale, onWarm, returning])
  const ready = miss.length === 0
  // KHÔNG hiện lời nhắc hàng loạt dưới các ô (Hiệp chê rối) — ô thiếu chỉ được
  // hướng dẫn bằng thẻ FormTour khi khách bấm GỬI THÔNG TIN mà còn thiếu/sai.
  const fp = (k: string) => ({ tour: k })
  // SĐT nhập SAI (đã gõ nhưng không đúng 0 + 9 số) → dòng đỏ cạnh nhãn.
  // Đang gõ dở thì chưa báo; báo khi rời ô hoặc đã đủ 10 số mà vẫn sai.
  const [phoneFocus, setPhoneFocus] = useState(false)
  const phoneBad = f.phone !== '' && miss.includes('phone') && (!phoneFocus || f.phone.length >= 10)

  return (
    <div className="gp" ref={ref} data-scene="rsvp">
      {/* không khí botanical ấm phía sau popup (nền cuộc gọi vẫn thấy qua lớp này) */}
      <span className="gp__veil" aria-hidden />
      {/* nắng qua cửa sổ phủ CẢ cảnh (trong lẫn ngoài kính) → kính trông trong thật */}
      <span className="gp__light" aria-hidden><i /></span>

      {/* khung liquid glass bọc cả tiêu đề + form */}
      <div className="gp__shell">
      <div className="gp__title" data-gp-item>
        <h2>{returning ? COPY.rsvpReturn.title : 'NHẬP THÔNG TIN CỦA BẠN'}</h2>
      </div>

      {returning ? (
        <div className="gp__card gp__card--back">
          <p className="gp__back-name" data-gp-item>{returning.address}</p>
          <p className="gp__back-line" data-gp-item>{returning.line}</p>
        </div>
      ) : (
      <>

      <form
        className="gp__card"
        onSubmit={(e) => {
          e.preventDefault()
          setNote(null)
          if (busy) return
          if (!ready) {
            setFix(miss)
            return
          }
          setBusy(true)
          onSubmit(f)
            .then((err) => setNote(err))
            .catch(() => setNote('Có lỗi khi gửi, bạn thử lại nhé.'))
            .finally(() => setBusy(false))
        }}
        noValidate
      >
        <div className="gp__scroll">
          <div className="gp__row2" data-gp-item>
            <Field {...fp('fullName')} label="Họ và tên" req>
              <Input icon={<IUser />} placeholder="Họ và tên" value={f.fullName} onChange={(v) => set('fullName', titleCaseVi(v))} autoComplete="name" />
            </Field>
            <Field {...fp('nickname')} label="Tên gọi thân mật" req>
              <Input icon={<IHome />} placeholder="Biệt danh" value={f.nickname} onChange={(v) => set('nickname', titleCaseVi(v))} />
            </Field>
          </div>

          <Field {...fp('phone')} label="Số điện thoại" req error={phoneBad ? COPY.rsvpIntro.phoneError : null}
            onFocusIn={() => setPhoneFocus(true)} onFocusOut={() => setPhoneFocus(false)}>
            <Input icon={<IPhone />} placeholder="Số điện thoại" value={f.phone} onChange={(v) => set('phone', v.replace(/\D/g, '').slice(0, 10))} type="tel" inputMode="tel" autoComplete="tel" />
          </Field>

          <Field {...fp('relationship')} label="Relationship" req>
            <label className={`gp__input gp__select ${f.relationship ? '' : 'is-empty'}`}>
              <IHeart />
              <select value={f.relationship} onChange={(e) => set('relationship', e.target.value as Relationship)} aria-label="Relationship">
                <option value="" disabled>Anh/chị là gì của em?</option>
                {RELATIONSHIPS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <svg className="gp__caret" viewBox="0 0 24 24" width="16" height="16" aria-hidden><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </label>
          </Field>

          <Field {...fp('gender')} label="Giới tính" req>
            <div className="gp__gender" role="radiogroup" aria-label="Giới tính">
              <button type="button" role="radio" aria-checked={f.gender === 'nu'} disabled={!!lockGender && lockGender !== 'nu'}
                className={`gp__sex is-nu ${f.gender === 'nu' ? 'is-on' : ''}`} onClick={() => set('gender', 'nu')}>
                <IFemale />Nữ
              </button>
              <button type="button" role="radio" aria-checked={f.gender === 'nam'} disabled={!!lockGender && lockGender !== 'nam'}
                className={`gp__sex is-nam ${f.gender === 'nam' ? 'is-on' : ''}`} onClick={() => set('gender', 'nam')}>
                <IMale />Nam
              </button>
              <span className="gp-orb gp-orb--lg" aria-hidden />
            </div>
          </Field>

          <Field {...fp('email')} label="Email" req>
            <Input icon={<IMail />} placeholder="....@gmail.com" value={f.email} onChange={(v) => set('email', v)} type="email" inputMode="email" autoComplete="email" />
          </Field>

          <Field tour="dob" label="DATE OF BIRTH">
            <DateField value={f.dob} onChange={(v) => set('dob', v)} placeholder="Ngày sinh" />
          </Field>

          {/* <Field tour="hobbies" label="Sở thích">
            <Input icon={<IStar />} placeholder="Hobbies" value={f.hobbies} onChange={(v) => set('hobbies', v)} />
          </Field> */}

          <Field tour="description" label="Mô tả bản thân">
            <label className="gp__input gp__area">
              <textarea rows={3} placeholder="E.g: Đẹp trai / Xinh gái / Giàu / Thông minh / … ✨" value={f.description}
                onChange={(e) => set('description', e.target.value)} maxLength={400} />
              <IPen />
            </label>
          </Field>

          <Field {...fp('photo')} label="Ảnh của bạn" req grow>
            <PhotoPicker url={photoUrl} onPick={(file) => { setNote(null); if (file) set('photo', file) }} />
          </Field>

        </div>

        {/* báo lỗi luôn nằm ngay trên nút (không bị khuất trong vùng cuộn) */}
        {note && (
          <p className="gp__hint" role="alert">{note}</p>
        )}

        <div className="gp__actions" data-gp-item>
          <button type="submit" className={`gp__btn gp__submit ${ready ? 'is-ready' : ''}`} aria-disabled={!ready || busy}>
            {busy ? 'ĐANG GỬI…' : 'GỬI THÔNG TIN'}
          </button>
          <button type="button" className={`gp__btn gp__cancel ${ready ? 'is-ready' : ''}`} onClick={onCancel}>
            Hủy bỏ
          </button>
        </div>
        <span className="gp-orb gp-orb--sm" aria-hidden />
      </form>
      </>
      )}
      </div>

      {!returning && intro && <FormTour delay={1.35} onDone={endIntro} />}
      {!returning && !intro && fix && <FormTour key={fix.join()} delay={0} only={fix} onDone={() => setFix(null)} />}

      <svg className="gp__sparkle" viewBox="0 0 24 24" aria-hidden>
        <path fill="currentColor" d="M12 1c.6 5.6 2.9 9.4 11 11-8.1 1.6-10.4 5.4-11 11-.6-5.6-2.9-9.4-11-11 8.1-1.6 10.4-5.4 11-11z" />
      </svg>
    </div>
  )
})

export default GlassPopup

type FieldProps = {
  label: string
  req?: boolean
  tour?: string
  /** lời nhắc hiện dưới ô bắt buộc khi còn trống/sai và khách không đang nhập ô đó */
  hint?: string | null
  /** dòng đỏ cạnh nhãn khi nhập sai định dạng */
  error?: string | null
  /** ô giãn ra lấp phần trống còn lại của form (khu ảnh) */
  grow?: boolean
  onFocusIn?: () => void
  onFocusOut?: () => void
  children: ReactNode
}
function Field({ label, req, tour, hint, error, grow, onFocusIn, onFocusOut, children }: FieldProps) {
  return (
    <div className={`gp__field ${error ? 'is-error' : ''} ${grow ? 'gp__field--grow' : ''}`} data-gp-item data-tour={tour} onFocus={onFocusIn} onBlur={onFocusOut}>
      <span className="gp__label">
        {label}
        {req && <span className="sr-only"> (bắt buộc)</span>}
      </span>
      {children}
      {error && <p className="gp__err" role="alert">{error}</p>}
      {hint && <p className="gp__tip" role="note">{hint}</p>}
    </div>
  )
}

type InputProps = {
  icon: ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
}
function Input({ icon, placeholder, value, onChange, type = 'text', inputMode, autoComplete }: InputProps) {
  return (
    <label className="gp__input">
      {icon}
      <input type={type} inputMode={inputMode} autoComplete={autoComplete} placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
