---
description: Bắt đầu một cảnh/giai đoạn mới đúng khung dự án (state machine, timeline GSAP, test, tài liệu)
argument-hint: "<tên cảnh, vd: FemaleEnvelope>"
---
Chuẩn bị làm cảnh mới: $ARGUMENTS

1. Đọc `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/VE-THIEP-DUNG-CHUNG.md` (nếu là nhánh Nữ).
2. Đề xuất cho Hiệp (CHƯA code): các state + event mới trong `src/state/experienceMachine.ts`, file timeline trong `src/animations/gsap/`, component/scene, asset cần có. Chờ Hiệp đồng ý.
3. Khi code: thêm state vào machine trước; mỗi timeline có label + onComplete → `sendExperience('DONE')`; expose `window.__xxx` khi `?qa`; cleanup đầy đủ.
4. Thêm test vào `tests/e2e/` (waitState + snap ở từng mốc), chạy `npx playwright test -g "<tên>"`.
5. `npm run verify` xanh → cập nhật `CLAUDE.md` (mục Tiến độ + thiết kế đã chốt) → cho Hiệp xem từng bước.
