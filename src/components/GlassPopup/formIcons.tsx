/* Icon nét mảnh cho form (SVG, stroke = currentColor). */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const IUser = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...S}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" />
  </svg>
)
export const IHome = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...S}>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 9.5V20h12V9.5M10 20v-5h4v5" />
  </svg>
)
export const IPhone = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...S}>
    <path d="M7 3.5 9.4 7 8 8.8c1 2.2 2.9 4.1 5.2 5.2l1.8-1.4 3.5 2.4-1 2.6c-.3.8-1.2 1.2-2 1-6.2-1.6-10.6-6-12.1-12.2-.2-.8.2-1.7 1-2z" />
  </svg>
)
export const IHeart = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...S}>
    <path d="M12 19.5s-7.5-4.4-7.5-9.6A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.5c0 5.2-7.5 9.6-7.5 9.6z" />
  </svg>
)
export const IIdCard = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...S}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
    <circle cx="8.6" cy="11" r="1.9" />
    <path d="M5.8 15.6c.6-1.3 1.6-2 2.8-2s2.2.7 2.8 2M13.5 10h4.5M13.5 13.5h3" />
  </svg>
)
export const IMail = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...S}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3.8 7 8.2 6 8.2-6" />
  </svg>
)
export const ICalendar = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...S}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="M7.5 13h1M11.5 13h1M15.5 13h1M7.5 16.5h1M11.5 16.5h1" strokeWidth="2" />
  </svg>
)
export const IStar = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...S}>
    <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
  </svg>
)
export const IPen = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...S}>
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z" />
    <path d="m14.5 7.5 3 3" />
  </svg>
)
export const ICamera = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...S}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.5-2h5.4l1.5 2h2.3A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
    <circle cx="12" cy="12.8" r="3.4" />
  </svg>
)
export const IFemale = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...S} strokeWidth={2}>
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7M8.8 18h6.4" />
  </svg>
)
export const IMale = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...S} strokeWidth={2}>
    <circle cx="10" cy="14" r="5" />
    <path d="M13.6 10.4 20 4M15 4h5v5" />
  </svg>
)
