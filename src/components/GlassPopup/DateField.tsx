import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { DayPicker, type DropdownProps } from 'react-day-picker'
import { vi } from 'react-day-picker/locale'
import { ICalendar } from './formIcons'
import './DateField.css'

/**
 * Ô "Ngày sinh" + lịch chọn ngày kiểu shadcn/ui Calendar.
 * Dùng đúng bộ lịch mà shadcn dùng bên dưới (react-day-picker), style viết tay theo mẫu
 * shadcn (dự án không dùng Tailwind/shadcn): tiêu đề "Tháng 12 ⌄ 2026 ⌄" chọn nhanh
 * tháng/năm, mũi tên trước/sau, ngày ngoài tháng mờ, ngày chọn nền sáng.
 * Giá trị giữ dạng 'YYYY-MM-DD' như input date cũ.
 */
type Props = { value: string; onChange: (v: string) => void; placeholder: string }

const toDate = (v: string) => (v ? new Date(`${v}T00:00:00`) : undefined)
const toValue = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const show = (v: string) => (v ? v.split('-').reverse().join('/') : '')

export default function DateField({ value, onChange, placeholder }: Props) {
  const btn = useRef<HTMLButtonElement>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)

  const open = () => setHost(btn.current!.closest('.gp') as HTMLElement)

  return (
    <>
      <button type="button" ref={btn} className={`gp__input gp__date ${value ? '' : 'is-empty'}`} onClick={open} aria-haspopup="dialog">
        <ICalendar />
        <span className={value ? 'gp__date-val' : 'gp__date-ph'}>{value ? show(value) : placeholder}</span>
      </button>
      {host &&
        createPortal(
          <Popover anchor={btn.current!} host={host} value={value} onClose={() => setHost(null)} onPick={(v) => { onChange(v); setHost(null) }} />,
          host,
        )}
    </>
  )
}

function Popover({ anchor, host, value, onPick, onClose }: {
  anchor: HTMLElement
  host: HTMLElement
  value: string
  onPick: (v: string) => void
  onClose: () => void
}) {
  const card = useRef<HTMLDivElement>(null)
  const today = new Date()
  const selected = toDate(value)
  const [month, setMonth] = useState(() => selected ?? new Date(today.getFullYear() - 22, today.getMonth()))

  // đặt lịch ngay dưới ô (không đủ chỗ thì lên trên, vẫn không đủ thì kẹp trong khung),
  // đo kích thước THẬT của lịch rồi mới bật ra (GSAP, nhanh — phản hồi UI)
  useLayoutEffect(() => {
    const c = card.current!
    const r = anchor.getBoundingClientRect()
    const h = host.getBoundingClientRect()
    const H = c.offsetHeight, W = c.offsetWidth, M = 8
    let top = r.bottom - h.top + M
    let up = false
    if (top + H > h.height - M) {
      const above = r.top - h.top - M - H
      if (above >= M) { top = above; up = true } else top = Math.max(M, h.height - M - H)
    }
    const left = Math.min(Math.max(M, r.left - h.left + r.width / 2 - W / 2), h.width - M - W)
    gsap.set(c, { top, left, transformOrigin: up ? '50% 100%' : '50% 0' })
    const tw = gsap.fromTo(c, { autoAlpha: 0, scale: 0.96, y: up ? 6 : -6 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.22, ease: 'power2.out' })
    return () => { tw.kill() }
  }, [anchor, host])

  return (
    <div className="dp-layer" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={card} className="dp-card" role="dialog" aria-label="Chọn ngày sinh">
        <DayPicker
          mode="single"
          locale={vi}
          weekStartsOn={0}
          showOutsideDays
          fixedWeeks
          captionLayout="dropdown"
          startMonth={new Date(1950, 0)}
          endMonth={today}
          disabled={{ after: today }}
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={(d) => d && onPick(toValue(d))}
          components={{ Dropdown: ListDropdown }}
          formatters={{
            formatMonthDropdown: (d) => `Tháng ${d.getMonth() + 1}`,
          }}
        />
      </div>
    </div>
  )
}

/**
 * Ô chọn Tháng / Năm kiểu shadcn Select: danh sách tối cuộn được (thay <select> gốc —
 * trên máy tính trình duyệt mở danh sách trắng xấu, lệch khỏi thiết kế).
 */
function ListDropdown({ options = [], value, onChange, disabled, 'aria-label': label }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === Number(value))

  useEffect(() => {
    if (!open) return
    // cuộn tới mục đang chọn (giữa danh sách)
    const sel = list.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (sel && list.current) list.current.scrollTop = sel.offsetTop - list.current.clientHeight / 2 + sel.offsetHeight / 2
    const off = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', off, true)
    return () => document.removeEventListener('pointerdown', off, true)
  }, [open])

  const pick = (v: number) => {
    setOpen(false)
    onChange?.({ target: { value: String(v) } } as unknown as ChangeEvent<HTMLSelectElement>)
  }

  return (
    <span ref={root} className={`dp-dd ${open ? 'is-open' : ''}`}>
      <button type="button" className="rdp-caption_label dp-dd__btn" aria-label={label} aria-haspopup="listbox" aria-expanded={open}
        disabled={disabled} onClick={() => setOpen((o) => !o)}>
        {current?.label}
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div ref={list} className="dp-dd__list" role="listbox" aria-label={label}>
          {options.map((o) => (
            <button key={o.value} type="button" role="option" aria-selected={o.value === Number(value)} disabled={o.disabled}
              className="dp-dd__opt" onClick={() => pick(o.value)}>
              {o.label}
              {o.value === Number(value) && (
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}
