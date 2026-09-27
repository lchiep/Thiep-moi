# Thiệp mời Graduation Gala 2026

Thiệp mời tốt nghiệp dạng web, dành cho điện thoại, theo phong cách điện ảnh 3D. Dự án chỉ dùng cho một dịp. Web là trang tĩnh chạy trên **Vercel**, dữ liệu khách lưu trên **Supabase**.

Kiến trúc, sơ đồ, luồng dữ liệu và ngân sách hiệu năng: xem [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

> **Trạng thái:** Phase 1 (khung dự án) và phần database Supabase đã xong. Chưa có code giao diện.

## Công nghệ

| Vai trò | Thư viện / dịch vụ |
|---|---|
| Khung | React 19, Vite 8, TypeScript 5.9 |
| 3D | three, @react-three/fiber, @react-three/drei |
| Chuyển động chính | gsap (+ Draggable, MotionPathPlugin, ScrollTrigger), @gsap/react |
| Hiệu ứng nhỏ | animejs 4 |
| Trạng thái | zustand |
| Điều hướng | react-router-dom 7 |
| Dữ liệu | Supabase (Postgres + Storage) qua @supabase/supabase-js |
| Deploy | Vercel |

## Cài đặt lần đầu (Windows, trong `C:\Project\Thiep_moi`)

Cần Node.js 20 trở lên.

```bash
npm install
copy .env.example .env.local
```

`.env.example` đã điền sẵn URL và khoá publishable của Supabase. Việc còn lại là sửa `VITE_EVENT_CONTACT` thành số điện thoại thật.

## Chạy

```bash
npm run dev        # http://localhost:5173
npm run dev:host   # để điện thoại cùng Wi-Fi mở được qua IP của máy tính
npm run build      # build ra thư mục dist/
npm run preview    # chạy thử bản build
```

## Supabase

- Project: **thiep-moi-graduation-gala** (region Singapore).
- Cấu trúc bảng, các hàm và bucket ảnh nằm trong `supabase/schema.sql` (đã áp dụng).
- Khách chỉ **ghi** được qua 3 hàm: `register_guest`, `submit_rsvp`, `submit_wish`. Khách không đọc được dữ liệu của ai, kể cả của chính mình.
- **Xem danh sách khách:** vào Supabase Dashboard → Table Editor → view `guest_overview` (có mã vé, tên, giới tính, SĐT, RSVP mới nhất, số lời chúc). Có thể xuất CSV từ đây.
- **Xem ảnh khách:** Storage → `guest-photos`.

## Deploy lên Vercel

1. Đẩy thư mục lên GitHub (file `.env.local` đã nằm trong `.gitignore` nên không bị đẩy lên).
2. Trên vercel.com chọn **Add New → Project**, rồi chọn repo. Vercel tự nhận Vite.
3. Vào **Settings → Environment Variables**, dán toàn bộ biến trong `.env.local`.
4. Bấm Deploy. Từ đó mỗi lần push code, Vercel tự build lại.

## Sau sự kiện

1. Xuất CSV từ `guest_overview`, `rsvps`, `wishes` nếu muốn giữ làm kỷ niệm.
2. **Xoá project Supabase**, vì trong đó có SĐT, CCCD và ảnh của khách.
3. Xoá hoặc tắt project trên Vercel.

## Đặt asset

| Thư mục | File |
|---|---|
| `public/assets/backgrounds/` | `call-scene.webp`, `female-flower-scene.webp`, `male-document-scene.webp` |
| `public/assets/models/` | `macbook.glb`, `graduation-cap.glb`, `envelope.glb`, `document-folder.glb`, `ticket.glb`, `bouquet.glb` (đã nén Meshopt/Draco) |
| `public/assets/female/` | `envelope-front.webp`, `envelope-back.webp`, `envelope-flap.webp`, `letter.webp`, `bouquet.webp` |
| `public/assets/male/` | `folder-front.webp`, `folder-back.webp`, `invitation.webp`, `airplane-ticket.webp` |
| `public/assets/textures/` | vân giấy, marble, vải (tối đa 2048px, dùng KTX2 hoặc WebP) |
| `public/assets/fonts/` | font thư pháp tiếng Việt `.woff2` (nếu có) |

Giới hạn dung lượng cho mỗi nhánh là khoảng 8 MB. Chi tiết xem mục 7 trong ARCHITECTURE.

## Quy tắc chuyển động

- Mỗi thuộc tính của một vật thể chỉ do **một** thư viện điều khiển.
- Toàn bộ trang chỉ có **một** Canvas Three.js. Chuyển cảnh bằng cách di chuyển group hoặc camera, không unmount canvas.
- Không dùng chuỗi `setTimeout` để nối hiệu ứng. Dùng GSAP Timeline, và báo `DONE` cho state machine trong `onComplete`.
- Mọi animation phải được dọn khi component unmount (`kill` hoặc `revert`).
