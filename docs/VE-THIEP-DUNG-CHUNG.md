# Nội dung vé + thiệp dùng chung cho nhánh Nữ (chốt 27/09/2026 — nhánh Nam đã duyệt "khá ok")

**Hiệp chốt:** nhánh Nữ dùng CHUNG **NỘI DUNG** (dữ liệu khách, chữ trên vé, chữ trên thiệp, thông tin buổi lễ).
**HIỆU ỨNG, CẢNH, CÁCH TRÌNH BÀY thì KHÁC** — nhánh Nữ có không gian riêng (lá thư, phong bì, bó tulip, ánh nắng ấm, hồng pastel/kem), cách vé xuất hiện riêng và thiệp riêng (vd Z-fold 3 tấm), KHÔNG copy cảnh/animation/giao diện của nhánh Nam.

Dưới đây: phần NÊN DÙNG LẠI (nguồn dữ liệu + chữ) và phần CHỈ THAM KHẢO (cách làm của nhánh Nam).

## 1. Dữ liệu khách (nguồn duy nhất)
- `src/state/guestStore.ts` → `useGuest().guest` (lưu localStorage, ảnh nén 600px, `photoFocus` = tâm khuôn mặt).
- `ticketFromGuest(guest)` → `{ guestName, guestAddress, guestFullName, guestPhoto, guestPhotoFocus, ticketNo }`.
- `guestAddress(guest)` → "Anh + biệt danh" (Nam) / "Chị + biệt danh" (Nữ) — chữ ở `COPY.invitationHeader.honorific`.
- Mã vé tạm `GH26-XXXX` (Phase 6: Supabase `register_guest` cấp mã chính thức).

## 2. Thông tin sự kiện (THẬT, theo thư mời Khoa CNTT)
`src/config/event.ts` (đọc từ env `VITE_EVENT_*`):
- Lễ Tốt nghiệp Sinh viên Khóa 27 ngành CNTT — **13h00 Thứ Sáu 16/10/2026 — Hội trường nhà B — HUBT, 29A Ngõ 124 Vĩnh Tuy**.
- `startISO` 2026-10-16T13:00+07:00 (đếm ngược), `dateLabel` "OCTOBER 16, 2026", `timeLabel` "13:00 FRIDAY", `host` CUNG HIỆP, `contact` (TẠM — cần số thật), `mapsUrl` = link Google Maps Hiệp gửi, `lat/lng` (TẠM — cần toạ độ thật).

## 3. VÉ — dùng chung NỘI DUNG (mẫu vé + chữ điền); cách vé xuất hiện là của riêng nhánh Nữ
- `src/components/Ticket/drawTicket.ts` → `drawTicket(ticketData)` trả canvas.
- Nền `public/assets/tickets/ticket-template.webp` (vé ngang 1608×635, đã xoá chữ ngày cũ).
- Code điền: ngày giờ (Cinzel), INVITEE = HỌ TÊN ĐẦY ĐỦ (Luxurious Script đỏ đô), HOST/CONTACT/VENUE/địa chỉ (EB Garamond — `TICKET_TYPE='ebGaramond'`), ảnh khách cắt theo khuôn mặt, số vé dọc trên cuống.
- Vé DOM nét để phóng to/xem ngang: dùng lại canvas này (`toDataURL`).
- Nhánh Nữ: "VÉ RA TRƯỚC" khỏi phong bì — dùng cùng canvas vé (cùng nội dung), còn chuyển động/ánh sáng/khung cảnh làm MỚI cho hợp cảnh tulip. `ticketFocusTimeline` chỉ để tham khảo kỹ thuật FLIP.

## 4. THIỆP — dùng chung NỘI DUNG; giao diện/hiệu ứng thiệp Nữ làm RIÊNG

Nội dung phải giống: header (CHÂN THÀNH KÍNH MỜI · LỄ VINH DANH · GRADUATION GALA 2026 · TRÂN TRỌNG KÍNH MỜI · HỌ TÊN · "Chị + biệt danh") và 5 mục (lời mời, thời gian & địa điểm + lễ tân, đếm ngược + bản đồ, hướng dẫn, xác nhận tham dự + lời chúc) — lấy chữ từ `COPY.invitationHeader` / `COPY.sections`, `EVENT`.

Thiệp của nhánh Nam (chỉ THAM KHẢO cách làm — không bê nguyên sang):
- `src/scenes/InvitationScene/` — `InvitationScene` props `{ fullName, address, active, onBack }`.
  - Nền nhung đỏ đô `invitation/burgundy.webp`, giấy mới `invitation/paper.webp` (852×1846, 2 nhành lá vàng, khung lá 37.7%→95.5%), dấu sáp `invitation/seal.webp`.
  - Header (vị trí/cỡ ở `inviteHeader.ts`, cỡ chữ `min(cqw,cqh)`): CHÂN THÀNH KÍNH MỜI · LỄ VINH DANH · GRADUATION GALA 2026 · TRÂN TRỌNG KÍNH MỜI · HỌ TÊN (tự thu nhỏ `fitFs`) · "Anh/Chị + biệt danh" (thư pháp).
  - 5 trang, mỗi lần 1 trang (scroll-snap stop always), chữ in thẳng lên giấy, số thẳng hàng (lnum): Lời mời · Thời gian & địa điểm (+ lễ tân 1 dòng) · Đếm ngược (mũ cử nhân 3D) + bản đồ Leaflet/OSM + nút XEM BẢN ĐỒ · Hướng dẫn (trang phục ô màu, chụp ảnh) · Xác nhận tham dự ①②③ + Gửi lời chúc (lắc khi chọn ③) + "— Hẹn gặp bạn —".
  - Nút "← Quay lại" góc trái dưới (prop `onBack`).
- Texture thiệp 3D khớp thiệp DOM: `src/components/DocumentFolder/drawInvitationCard.ts` (`drawInvitationCard(fullName, address)`).
- Chữ: `src/config/copy.ts` → `invitationHeader`, `sections`.

## 5. Việc cần làm cho nhánh Nữ
- Luồng: popup → lá thư → vào phong bì (dấu sáp H) → cảnh trượt phải sang cảnh tulip → "CHẠM VÀO THƯ ĐỂ MỞ" → phong bì mở → VÉ RA TRƯỚC → thư/thiệp → `InvitationScene` (dùng lại).
- Thiệp Nữ: component/scene RIÊNG (vd `FemaleInvitation`/Z-fold), đọc cùng dữ liệu (`guest`, `guestAddress`, `COPY`, `EVENT`). Có thể tách các khối logic dùng lại được (Countdown, MapPreview, RSVP/lời chúc) thành component chung, nhưng khoác giao diện riêng (hồng pastel / kem / tulip).
- Thêm state Nữ trong `experienceMachine.ts` (đã có `FEMALE_LETTER_TRANSFORM`), bật `GO_FEMALE` trong `CallScene.onSubmit` (hiện đang trả lời "Nhánh Nữ đang được làm").
- Test nhanh: `npm run dev` + `?mock=nu` (form điền sẵn, chọn Nữ).
