# CLAUDE.md — Thiệp mời Graduation Gala 2026

Hướng dẫn cho Claude Code trong repo này. Trả lời Hiệp bằng **tiếng Việt**, ngắn gọn, dễ hiểu.

## Dự án là gì
Web thiệp mời tốt nghiệp **mobile-first** (390×844), phong cách điện ảnh/sang trọng: khách cảm giác đang cầm và mở một bộ thiệp giấy thật. Một dịp duy nhất: Lễ Tốt nghiệp Khóa 27 CNTT — **13h00 Thứ Sáu 16/10/2026, Hội trường nhà B, HUBT**, sau đó xoá.

**Đọc thêm khi cần (đừng đoán):**
| Việc | File |
|---|---|
| Quyết định thiết kế đã chốt, tiến độ từng cảnh | `docs/QUYET-DINH-THIET-KE.md` |
| Kiến trúc, state machine, luồng dữ liệu, ngân sách hiệu năng | `docs/ARCHITECTURE.md` |
| Nhánh Nữ dùng chung nội dung vé + thiệp với Nam | `docs/VE-THIEP-DUNG-CHUNG.md` |
| Bộ kiểm tra tự động (harness) | `docs/HARNESS.md` |
| Prompt tạo ảnh | `docs/ASSET-PROMPTS.md` |

Ảnh gốc Hiệp tạo: `assets-src/` (chỉ đọc). Ảnh đã xử lý: `public/assets/`.

## Lệnh
```bash
npm run dev            # http://localhost:5173 — popup có sẵn dữ liệu mẫu (?nomock tắt, ?mock=nu thử Nữ)
npm run dev:host       # mở trên điện thoại cùng Wi-Fi
npm run verify         # typecheck + check:rules + build — PHẢI xanh trước khi báo xong
npm run check:rules    # quét luật dự án (scripts/check-rules.mjs)
npm run test:e2e       # Playwright: chạy luồng thật + so ảnh 4 cỡ màn (375/390/393/430)
npm run test:e2e:report
```
Env: copy `.env.example` → `.env.local` (Claude KHÔNG đọc/sửa file env thật).

## Stack (không thêm thư viện UI khác)
React 19 · Vite 8 · TypeScript · three / @react-three/fiber / drei · **GSAP** (+ Draggable, ScrollTrigger, @gsap/react) · **Anime.js v4** · zustand · Leaflet · react-day-picker · Supabase · deploy **Vercel**.
**KHÔNG**: Tailwind, shadcn, framer-motion, UI kit, Node/Express server riêng. CSS viết tay theo token.

## Quy tắc bắt buộc (phần lớn đã được `check:rules` + hook kiểm tự động)
1. **Mỗi thuộc tính một chủ điều khiển**: GSAP (vị trí/xoay/scale/opacity khối lớn, chuyển cảnh, kéo, cuộn) · Anime.js (chuyển động nhỏ trên phần tử con) · Three/R3F (vật liệu, ánh sáng, camera) · CSS (layout, style tĩnh) · React (chỉ state — **không** setState mỗi frame).
2. **Không `setTimeout`** cho hiệu ứng → GSAP timeline (label, onComplete) + cleanup (`useGSAP`, `.kill()`, Anime `revert()`, `cancelAnimationFrame`, `clearInterval`).
3. **Không crossfade/teleport**: vật A biến đổi/di chuyển thành vật B tại chỗ. Vị trí đích đo bằng `getBoundingClientRect()`/hình chiếu 3D, không hard-code pixel.
4. **Chuyển trạng thái qua** `src/state/experienceMachine.ts` (`sendExperience(event)`).
5. Màu/font/khoảng cách từ `src/styles/tokens.css`. Mỗi cảnh có `data-scene`. Trong khung điện thoại dùng `cqw`/`cqh`, không `vw`/`dvh`.
6. Chữ ở `src/config/copy.ts` (Hiệp hay tự sửa file này — luôn giữ thay đổi của Hiệp), thông tin buổi lễ ở `src/config/event.ts`. Không hard-code dữ liệu khách.
7. Tôn trọng `prefers-reduced-motion`. Input font-size ≥ 16px.
8. Tuyệt đối **không**: đóng dấu / "BẠN ĐƯỢC DUYỆT", máy bay giấy, UI kiểu dashboard, neon.

## Harness — quy trình khi sửa code
- Sửa file trong `src/` → hook chạy `check:rules` trên file đó; vi phạm thì sửa ngay.
- Trước khi dừng → hook chạy typecheck + check:rules; đỏ thì chưa được báo xong.
- Sửa giao diện/hiệu ứng → `/qa-mobile` (test Playwright + so ảnh). Ảnh khác do **thay đổi có chủ đích** → hỏi Hiệp, **không tự cập nhật ảnh gốc**.
- Thêm cảnh mới → `/new-scene`; sửa hiệu ứng → `/review-motion`; sửa chữ → `/copy`.
- Test cần mốc mới: expose `window.__xxx` chỉ khi URL có `?qa`; trạng thái hiện tại có ở `<html data-exp>`; `window.__send(event)` gửi sự kiện.
- Chi tiết: `docs/HARNESS.md`.

## Supabase
Project `thiep-moi-graduation-gala` (ref `jbnemrbfdxngqzlrsyve`), schema `supabase/schema.sql`. Khách (anon) **chỉ ghi** qua RPC `register_guest` / `submit_rsvp` / `submit_wish` + upload ảnh vào bucket riêng tư `guest-photos/{uuid}/…`. Không bảng nào cho anon đọc — đừng thêm policy SELECT. Frontend chỉ dùng khoá publishable, không bao giờ service_role.

## Cấu trúc
```
src/
  app/          App.tsx (khung .app__phone), DesignPreview (#design)
  config/       copy.ts, event.ts
  state/        experienceMachine.ts, guestStore.ts
  scenes/       CallScene, MaleScene, InvitationScene (FemaleScene: Phase 8)
  components/   CallScreen, SlideToAnswer, GlassPopup, Ticket, DocumentFolder, WallTitle, DustMotes, …
  animations/   motion.ts, gsap/*.ts, anime/*.ts
  three/        MaleStage.tsx
  styles/       tokens.css, global.css
scripts/        check-rules.mjs, claude-hooks/*.mjs
tests/          e2e/*.spec.ts, fixtures/, __screenshots__/<os>/<cỡ màn>/
```

## Tiến độ (tóm tắt — chi tiết ở docs/QUYET-DINH-THIET-KE.md)
- ✅ 1 setup · 2 design system · 3 màn cuộc gọi · 4 vuốt nghe máy · 5 popup · 7 nhánh Nam (Hiệp duyệt "khá ok" 27/09) · màn thiệp 5 trang + bản đồ Leaflet (kéo/zoom/◎) · harness (27/09)
- ⏭️ 8 nhánh Nữ (cảnh + hiệu ứng riêng, nội dung chung) · 6 đồng bộ Supabase · 12 RSVP/lời chúc lên Supabase · 14 tối ưu · 15 test mobile + deploy Vercel
- Còn TẠM: SĐT người đón tiếp (`EVENT.contact`).

## Cách làm việc với Hiệp
- Làm **từng bước**, xong bước nào cho xem bước đó. Hiệp nói "chưa code" → chỉ bàn/viết tài liệu.
- Hiệp đánh giá cao **độ thật như ảnh chụp** — đừng đưa bản thử kém chất lượng như kết quả cuối.
- Khi Hiệp chốt quyết định mới → ghi vào `docs/QUYET-DINH-THIET-KE.md`.
