/* Icon vẽ tay bằng SVG (không dùng ảnh) — nét mảnh kiểu iOS. */

export function IconAlarm() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <circle cx="12" cy="13" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 9.2V13l2.6 1.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.2 6.2 7 3.6M19.8 6.2 17 3.6M7.5 19.4 6 21M16.5 19.4 18 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconMessage() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        d="M12 3.8c-5 0-9 3.3-9 7.4 0 2.3 1.3 4.4 3.3 5.8-.2 1.3-.9 2.5-1.9 3.3 1.9 0 3.6-.7 4.8-1.8.9.2 1.8.3 2.8.3 5 0 9-3.3 9-7.4S17 3.8 12 3.8Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden>
      <path
        d="M6.6 2.9c.5-.3 1.2-.2 1.6.3l2.2 3c.4.5.3 1.2-.1 1.6l-1.3 1.3c-.2.2-.3.6-.1.9.9 1.8 2.6 3.6 4.4 4.6.3.2.7.1.9-.1l1.3-1.3c.4-.4 1.1-.5 1.6-.1l3 2.2c.5.4.6 1.1.3 1.6l-1.1 1.9c-.5.9-1.6 1.4-2.6 1.2C9.9 18.6 5.4 14.1 3.9 7.3c-.2-1 .3-2 1.2-2.6z"
        fill="currentColor"
      />
    </svg>
  )
}
