---
description: Soát hiệu ứng/animation vừa sửa (quyền điều khiển GSAP/Anime/CSS/React, cleanup, easing, không teleport)
argument-hint: "[file hoặc cảnh, vd: MaleScene | femaleEnvelopeTimeline.ts]"
---
Soát chuyển động của: $ARGUMENTS (bỏ trống = mọi file trong `src/animations`, `src/scenes`, `src/components` đổi so với commit gần nhất — xem `git diff --name-only HEAD`).

Giao cho sub-agent **gsap-motion** kiểm tra và trả về danh sách vấn đề theo mức độ:
- Một thuộc tính bị 2 engine cùng điều khiển (GSAP + Anime.js + CSS transition + React style trên cùng phần tử/thuộc tính).
- Chuỗi setTimeout, setState mỗi frame, tween top/left/width/height.
- Timeline/tween/Anime/rAF/interval không được kill/revert/cancel khi unmount.
- Chuyển cảnh kiểu fade A → hiện B (teleport/crossfade) thay vì vật thể di chuyển liên tục.
- Easing linear, chuyển động giật/khựng, vị trí đích hard-code pixel.
Sau đó giao sub-agent **invitation-reviewer** soát luật chung trên cùng các file.

Tổng hợp cho Hiệp bằng tiếng Việt (ngắn, có file:dòng). Hỏi trước khi sửa những thay đổi lớn về cảm giác chuyển động.
