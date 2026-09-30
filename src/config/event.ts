/**
 * Thông tin sự kiện — đọc từ .env.local (VITE_EVENT_*).
 * Giá trị mặc định dưới đây là DỮ LIỆU TẠM (mock); Hiệp sẽ thay bằng thật.
 */
const env = import.meta.env

function read(key: string, fallback: string): string {
  const v = env[key]
  return typeof v === 'string' && v.trim() !== '' ? v : fallback
}

export const EVENT = {
  // THÔNG TIN THẬT theo thư mời của Khoa CNTT – HUBT (Hiệp gửi 27/09)
  name: read('VITE_EVENT_NAME', 'Graduation Gala 2026'),
  ceremony: read('VITE_EVENT_CEREMONY', 'Lễ Tốt nghiệp Sinh viên Khóa 27 ngành Công nghệ Thông tin'),
  startISO: read('VITE_EVENT_START', '2026-10-16T13:00:00+07:00'),
  dateLabel: read('VITE_EVENT_DATE_LABEL', 'OCTOBER 16, 2026'),
  timeLabel: read('VITE_EVENT_TIME_LABEL', '13:00 FRIDAY'),
  host: read('VITE_EVENT_HOST', 'CUNG HIỆP'),
  contact: read('VITE_EVENT_CONTACT', '0985 361 244'), // TẠM
  venue: read('VITE_EVENT_VENUE', 'HANOI UNIVERSITY OF BUSINESS AND TECHNOLOGY (HUBT)'),
  address: read('VITE_EVENT_ADDRESS', '29A NGÕ 124 PHỐ VĨNH TUY, VĨNH HƯNG, HÀ NỘI'),
  // bản tiếng Việt cho trang "Thời gian & địa điểm" của thiệp
  venueVi: read('VITE_EVENT_VENUE_VI', 'Trường Đại học Kinh doanh và Công nghệ Hà Nội (HUBT)'),
  addressVi: read('VITE_EVENT_ADDRESS_VI', '29A Ngõ 124 Phố Vĩnh Tuy, Vĩnh Hưng, Hà Nội'),
  greeter: read('VITE_EVENT_GREETER', 'Lưu Cung Hiệp'),
  /** toạ độ ghim trên bản đồ — vị trí ĐÚNG của trường do Hiệp gửi (27/09) */
  lat: Number(read('VITE_EVENT_LAT', '21.000064705312877')),
  lng: Number(read('VITE_EVENT_LNG', '105.87777846990927')),
  hall: read('VITE_EVENT_HALL', 'Hội trường nhà B'),
  mapsUrl: read(
    'VITE_EVENT_MAPS_URL',
    'https://maps.app.goo.gl/bu5kia9D3XVXXy6W6', // link chuẩn Hiệp gửi (27/09)
  ),
} as const

export const eventStart = () => new Date(EVENT.startISO)
