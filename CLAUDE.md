# CLAUDE.md — Thiệp mời Graduation Gala 2026

Hướng dẫn cho Claude Code khi làm việc trong repo này. **Đọc hết trước khi sửa code.**
Trả lời người dùng (Hiệp) bằng **tiếng Việt**, ngắn gọn, dễ hiểu.

## Dự án là gì
Web thiệp mời tốt nghiệp **mobile-first** (390×844), phong cách điện ảnh/sang trọng: khách cảm giác đang cầm và mở một bộ thiệp giấy thật. Dùng cho **một dịp duy nhất**: Lễ Tốt nghiệp Sinh viên Khóa 27 ngành CNTT — **13h00 Thứ Sáu 16/10/2026, Hội trường nhà B, HUBT** (theo thư mời Khoa CNTT, Hiệp gửi 27/09), sau đó xoá.

- Tài liệu chi tiết: `docs/ARCHITECTURE.md` (sơ đồ, state machine, luồng dữ liệu, ngân sách hiệu năng), `docs/ASSET-PROMPTS.md` (prompt tạo ảnh).
- Ảnh gốc Hiệp tạo bằng Gemini: `assets-src/` (không deploy). Ảnh đã xử lý: `public/assets/`.

## Lệnh
```bash
npm install
npm run dev        # http://localhost:5173  (thêm #design để xem trang design system)
npm run dev:host   # mở trên điện thoại cùng Wi-Fi
npm run build      # tsc -b && vite build — PHẢI chạy pass trước khi báo xong
```
Env: copy `.env.example` → `.env.local`.

## Stack (không thêm thư viện UI khác)
React 19 · Vite 8 · TypeScript · three / @react-three/fiber / drei · **GSAP** (+ Draggable, ScrollTrigger, @gsap/react) · **Anime.js v4** · zustand · Supabase (`@supabase/supabase-js`) · deploy **Vercel**.

**KHÔNG** dùng: Tailwind, shadcn, framer-motion, UI kit/component library, Node/Express server riêng. CSS viết tay theo token.

## Quy tắc bắt buộc
1. **Mỗi thuộc tính của một phần tử chỉ có MỘT chủ điều khiển**:
   - GSAP: vị trí, xoay, scale, opacity của khối lớn, chuyển cảnh, kéo, cuộn.
   - Anime.js: chỉ chuyển động nhỏ (icon rung, gõ chữ, lấp lánh) — trên phần tử con, không đụng khối GSAP đang giữ.
   - Three/R3F: vật liệu, ánh sáng, camera.
   - CSS: layout, style tĩnh, keyframe trang trí đơn giản.
   - React: chỉ state/dữ liệu. **Không** setState mỗi frame.
2. **Không chuỗi `setTimeout`** cho hiệu ứng → dùng GSAP timeline (label, onComplete) và cleanup (`useGSAP`, `.kill()`, Anime `scope.revert()`).
3. **Không crossfade/teleport**: vật A biến đổi/di chuyển thành vật B tại chỗ. Vị trí đích đọc bằng `getBoundingClientRect()`, không hard-code pixel.
4. **Chuyển trạng thái qua state machine** `src/state/experienceMachine.ts` (`sendExperience(event)`); mỗi state chỉ nhận event hợp lệ.
5. **Màu/font/khoảng cách lấy từ `src/styles/tokens.css`**. Mỗi cảnh gắn `data-scene="call|rsvp|male|female|invitation"`. Màu đã đo từ ảnh mẫu — không tự đổi.
6. Trong khung điện thoại dùng đơn vị **`cqw`/`cqh`** (container `.app__phone`), không dùng `vw`/`dvh`.
7. Chữ nội dung/sự kiện **không hard-code trong component**: `src/config/copy.ts` (chữ), `src/config/event.ts` (ngày giờ, địa điểm — đọc từ env). Dữ liệu khách không hard-code.
8. Tôn trọng `prefers-reduced-motion`. Input font-size ≥16px (tránh iPhone zoom).
9. Tuyệt đối **không**: đóng dấu / "BẠN ĐƯỢC DUYỆT", máy bay giấy, UI kiểu dashboard, neon.

## Thiết kế đã chốt
- Font: **Luxurious Script** (tên khách, chữ thư pháp — Hiệp chọn 27/09 thay Imperial Script vì lỗi dấu tiếng Việt; canvas phải `fontsReady` kèm mẫu chữ Việt để tải mảnh font vietnamese), **Playfair Display** (tiêu đề "Graduation Gala" màn cuộc gọi), **Cormorant Garamond** (tiêu đề/nhãn/thân thiệp), **Inter** (UI, form, nút).
- Màn cuộc gọi: nền tối ấm (ảnh MacBook + mũ + tua đỏ), **không có thanh giờ/pin**.
- Popup (theo ảnh mẫu Hiệp gửi): nền = chính ảnh màn cuộc gọi (MacBook + mũ) phía sau, chỉ tối nhẹ · khung liquid glass bọc tiêu đề + form · nắng qua cửa sổ `window-light.webp` phủ cả cảnh · tất cả là kính TRONG kiểu iOS, chữ sáng · nhãn Playfair đậm · giới tính = 2 mảnh kính hồng/xanh nhạt dần sang phải + cầu pha lê trên Nam · mọc ra từ chính thanh "slide to answer".
- Ô Ngày sinh = `GlassPopup/DateField.tsx`: lịch kiểu shadcn/ui Calendar (dùng react-day-picker — thư viện lõi của shadcn Calendar — CSS tự viết, KHÔNG Tailwind/shadcn), chọn nhanh tháng/năm, không cho chọn ngày tương lai.
- DỮ LIỆU MẪU khi `npm run dev` (`MOCK_ON` trong GlassPopup.tsx): form điền sẵn + bỏ lời chào/hướng dẫn, chỉ cần up ảnh → GỬI. `?nomock` để tắt, `?mock=nu` thử nhánh Nữ. Bản build thật không có.
- Form bắt buộc (26/09): Họ và tên + Tên gọi thân mật (tự viết hoa chữ đầu mỗi từ, còn lại chữ thường — `titleCaseVi`), SĐT (đúng 10 số, bắt đầu 0, tự lọc ký tự không phải số), giới tính, email **@gmail.com**, ảnh. Không bắt buộc: CCCD, ngày sinh, sở thích, mô tả. KHÔNG hiện lời nhắc hàng loạt dưới các ô (Hiệp chê, 26/09). Chỉ khi bấm GỬI mà còn thiếu/sai → `FormTour only={...}` hiện thẻ hướng dẫn lần lượt từng ô còn thiếu. SĐT sai → dòng đỏ `COPY.rsvpIntro.phoneError` ngay DƯỚI ô + viền đỏ (không báo khi đang gõ dở). Ô Sở thích đang tắt (Hiệp comment). Khu "Ảnh của bạn" = `GlassPopup/PhotoPicker.tsx`: GIỮ kiểu ô nhập cũ (1 hàng, viền nét đứt), chỉ dài xuống lấp khoảng trống cuối form (Hiệp không muốn khu ảnh to kiểu khác); có ảnh → [icon camera tròn = chọn lại] + [ảnh nhỏ] — chạm ảnh → xem to (FLIP GSAP từ ảnh nhỏ, chạm để thu về).
- Nhánh Nam: tập tài liệu nhựa PP **đen nhám** trồi lên, mở theo gáy → thư mời + vé.
- Giấy thiệp MỚI (27/09, Hiệp gửi) `invitation/paper.webp` 852×1846: 2 nhành lá vàng ~22.7–33% chiều cao, khung lá nội dung 37.7%→95.5% (vùng nội dung to hơn). Header đặt lại trong `inviteHeader.ts` (3 dòng khách nằm giữa 2 nhành lá; họ tên dài tự thu nhỏ `fitFs`); cỡ chữ header `min(cqw, cqh)` để màn thấp không đè dòng.
- Header thiệp (26/09) — 3 dòng khách: "TRÂN TRỌNG KÍNH MỜI" (label vàng nhỏ) → HỌ VÀ TÊN (in hoa, vàng đậm) → "Anh/Chị + tên gọi thân mật" (Nam→Anh, Nữ→Chị, `guestAddress()` trong guestStore, chữ ở `COPY.invitationHeader.honorific`) bằng Imperial Script vàng. Dùng chung DOM (`InvitationScene`) + texture 3D (`drawInvitationCard`).
- **Nhánh Nữ dùng chung NỘI DUNG vé + thiệp** với nhánh Nam (dữ liệu khách, chữ, thông tin buổi lễ) nhưng **CẢNH, HIỆU ỨNG, GIAO DIỆN LÀ RIÊNG** (Hiệp chốt 27/09) — xem `docs/VE-THIEP-DUNG-CHUNG.md`.
- Nhánh Nữ: lá thư vào phong bì kem (dấu sáp đỏ đô chữ **H**) → cảnh tulip → mở → **vé ra trước**, thư ra sau.
- Màn thiệp (cả 2 nhánh): header cố định 36% + nội dung cuộn 64%, 5 mục theo thứ tự: ✉️ Lời mời thân mật → 🕒 Thời gian & địa điểm → ⏳ Lịch trình & 💌 Lời chúc → 📌 Hướng dẫn khách mời → 📝 Xác nhận tham dự.
- Tập hồ sơ mở (`MALE_WAITING_TAP`, chữ "CHẠM VÀO VÉ HOẶC THIỆP"): chạm TRÚNG vật (`hitAt` theo hình chiếu 3D `projectRect`) — thiệp trang trái → `OPEN_CARD` → `INVITATION_ENTER` (zoom thẳng vào thiệp, không có đoạn cất vé); trang phải/túi vé → `TAP` → rút vé; chạm ra ngoài → không làm gì. Sau khi cất vé/quay lại: xoá `focusTl/revealTl` cũ.
- Xem vé (`TICKET_VIEW`): VUỐT XUỐNG → `TICKET_STOW` (`stowTicketTimeline`: đảo focus + reveal, vé cắm lại vào túi) → `MALE_WAITING_TAP`; gợi ý "↓ Vuốt xuống để cất vé" ở đỉnh màn, vé DOM cao 82%. Vuốt phải vẫn sang thiệp. Rút vé dùng z TUYỆT ĐỐI + `restTickets()` sau khi cất/quay lại → vé không trôi dần lên sau nhiều lần.
- Nút "← Quay lại" (27/09) chữ nhỏ góc trái dưới màn thiệp (trên dải nhung): `INVITATION_VIEW –BACK→ INVITATION_EXIT` = tua NGƯỢC timeline vào thiệp từ cuối về label `stowed` (vé đã nằm yên trong túi) (camera lùi ra, bìa mở, chữ tường hiện lại) `–DONE→ MALE_WAITING_TAP` (chạm để rút vé lại được).
- Nội dung thiệp (26/09, theo nội dung Hiệp viết — chữ ở `COPY.sections`): 5 "TRANG", MỖI LẦN CHỈ HIỆN 1 TRANG trong vùng cuộn (`.inv__sec` min-height 100%, `scroll-snap-stop: always`, trang rời đi mờ + lùi nhẹ). Mỗi trang: tiêu đề thư pháp đỏ đô (ĐÃ BỎ dòng "0X — TIÊU ĐỀ" theo ý Hiệp) → nội dung in thẳng lên giấy (không khung) → dòng cuối nhỏ in nghiêng. 01 Lời mời · 02 Thời gian & địa điểm (+ người đón tiếp, `EVENT.venueVi/addressVi/greeter`) · 03 Đếm ngược THÁNG:NGÀY:GIỜ:PHÚT:GIÂY (font Oswald `--font-count`, mũ cử nhân 3D `invitation/grad-cap.webp` render bằng three.js, lơ lửng) + bản đồ THẬT Leaflet + nền CARTO/OpenStreetMap (`InvitationScene/MapPreview.tsx`, toạ độ `EVENT.lat/lng`; zoom thật 12–19, ghim đỏ đô cố định cỡ, điện thoại 1 ngón cuộn trang · 2 ngón chụm; KHÔNG dùng Google embed — lỗi ô "Maps" + zoom giả) + nút XEM BẢN ĐỒ nhỏ bên dưới mở link `EVENT.mapsUrl` · 04 Hướng dẫn (ô màu Đen/Be/Trắng) · 05 Xác nhận tham dự (①②③, chọn → hiện câu đáp; gửi → "Cảm ơn bạn nhé ♡") rồi BÊN DƯỚI là GỬI LỜI CHÚC (bấm mới mở ô viết; chọn ③ Không đi được → nút lắc nhẹ gợi ý, Anime.js `nudgeShake`; mở ô mà chưa viết gì rồi lướt đi → tự thu về nút) + "— Hẹn gặp bạn —". Icon nét mảnh thay emoji. Chữ nội dung: Cormorant 500, 17px, màu tối `--text`, quầng giấy sáng quanh chữ, SỐ THẲNG HÀNG (`lnum` — Cormorant mặc định dùng số kiểu cũ nhấp nhô, Hiệp chê).
- Vé: một component dùng chung 2 nhánh, vẽ từ dữ liệu khách (tên, ảnh, mã `GH26-XXXX` do Supabase cấp).

## Supabase
Project `thiep-moi-graduation-gala` (ref `jbnemrbfdxngqzlrsyve`). Schema: `supabase/schema.sql`.
Khách (anon) **chỉ ghi** qua RPC `register_guest` / `submit_rsvp` / `submit_wish` + upload ảnh vào bucket riêng tư `guest-photos/{uuid}/…`. Không bảng nào cho anon đọc — đừng thêm policy SELECT. Chỉ dùng khoá publishable ở frontend, không bao giờ dùng service_role.

## Cấu trúc
```
src/
  app/            App.tsx (khung .app__phone), DesignPreview (#design)
  config/         copy.ts, event.ts
  state/          experienceMachine.ts, guestStore.ts
  hooks/          useSwipeAnswer.ts
  scenes/         CallScene/ (cuộc gọi + popup dùng chung nền), Male/Female/Invitation (sắp có)
  components/     CallScreen/, SlideToAnswer/, GlassPopup/, Ticket/, Envelope/, DocumentFolder/, ...
  animations/     motion.ts (ease/duration), gsap/*.ts, anime/*.ts
  three/          MaleStage.tsx (cảnh 3D nhánh Nam, tải lazy)
  styles/         tokens.css, global.css
```

## Tiến độ
- ✅ Phase 1 setup · ✅ Phase 2 design system · ✅ Phase 3 màn cuộc gọi · ✅ Phase 4 vuốt nghe máy · ✅ Phase 5 popup (giao diện + kiểm tra form + mở/huỷ)
- Popup đã được Hiệp duyệt "khá ok" (25/09/2026). Chi tiết giao diện đã chốt:
  - Nền = ảnh màn cuộc gọi phía sau (tối nhẹ). KHÔNG dùng nền tường nắng (`rsvp-wall.webp` bỏ, còn file thừa).
  - Khung liquid glass (`.gp__shell`) bọc tiêu đề + form; nắng qua cửa sổ `textures/window-light.webp` (bóng khung cửa + lá theo ảnh Hiệp gửi 26/09, đã làm mờ, lưu dạng alpha) phủ CẢ cảnh phía sau mọi lớp kính (screen, opacity .32, trôi chậm).
  - Tiêu đề: thanh kính khói xám; chữ Inter Tight 600 màu trắng ngà + quầng sáng VÀNG. Nhãn: Playfair 700 + quầng vàng nhẹ hơn.
  - Kính TRONG kiểu thanh điều hướng iOS (blur 1–2px, gần như không phủ màu, viền trắng mảnh) → chữ/nhãn/icon màu SÁNG (#fbf6ee) + bóng tối mềm. Ô nhập LÕM (bóng đổ vào trong).
  - Giới tính: nút bo 12px, mặt kính trung tính; màu chỉ loang từ icon (Nữ hồng / Nam xanh), viền màu loang quầng ra xung quanh; cầu pha lê 70px đè lên chữ "Nam".
  - Nút: GỬI THÔNG TIN kính khói (đủ thông tin → xanh lục), Hủy bỏ kính sáng (đủ → đỏ đô). ✦ góc dưới phải, cầu nhỏ ở mép dưới.
  - Hủy bỏ → `popupCloseTimeline` (26/09): phản hồi NGAY — nội dung mờ cùng lúc, khung kính co clip-path về thanh trượt (~0.6s), giao diện cuộc gọi hiện lại song song. KHÔNG dùng `openTl.reverse()` (đảo từng lớp stagger → bị khựng/delay).
  - Ảnh đã chọn nằm GIỮA ô; icon camera ghim mép trái, mỗi lần vừa up ảnh hiện bong bóng kiểu iMessage "Có thể chọn camera để chọn ảnh khác" (~4.6s, CSS keyframe) rồi tự ẩn.
  - Popup mở → `GlassPopup/FormTour.tsx` (chữ ở `COPY.rsvpIntro`): 1 lời nhắn chào → hướng dẫn TỪNG Ô kiểu coach-mark (khung sáng khoét quanh ô `[data-tour]`, thẻ kính "k/10", Quay lại · Tiếp theo, ×) → form chính. Bỏ qua: KHÔNG dùng dấu × — chữ nhỏ "Tap 2 lần để bỏ qua" (lời chào: tap 2 lần ở đâu cũng được; thẻ: tap 2 lần vào thẻ, góc phải trên) hoặc CHẠM THẲNG vào ô trong form (lớp tối không chặn chạm, tắt hướng dẫn + nhập luôn); thẻ cuối không có "Bắt đầu điền", chỉ "← Quay lại"; hiện MỖI LẦN mở popup. `FormIntro.tsx` chỉ còn là re-export.
  - Hiệp KHÔNG thích: kiểu kính bạc đơn sắc, badge tròn màu đặc, nút viên thuốc tô màu cả nút.
- 🚧 **Phase 7 Nam** (bản đầu 25/09/2026, chờ Hiệp duyệt):
  - Bấm GỬI → `guestStore.saveFromForm` (ảnh nén 600px, mã vé tạm GH26-XXXX, localStorage) → Nam: `GO_MALE`; Nữ: tạm quay lại popup (Phase 8).
  - Tập tài liệu = **mô hình 3D thật** (`components/DocumentFolder/Folder3D.tsx`, R3F) trên nền ảnh cuộc gọi (canvas trong suốt, `three/MaleStage.tsx`): nhựa PP đen (clearcoat + bump vỏ cam), nắng ấm trên-trái, bóng đổ lên giường (shadowMaterial + ContactShadows).
  - Thiệp vẽ bằng canvas từ dữ liệu khách: `DocumentFolder/drawInvitationCard.ts`.
  - **Vé dùng chung** `Ticket/drawTicket.ts` — **vé NGANG theo ảnh mẫu Hiệp chọn** (bản vé đứng đã bỏ): nền = `public/assets/tickets/ticket-template.webp` (tách nền từ ảnh mẫu, đã xoá chỗ điền), code chỉ điền **họ và tên đầy đủ** ở INVITEE (Imperial Script), ảnh khách (khung góc lõm, cắt theo TÂM KHUÔN MẶT: `utils/faceFocus.ts` — FaceDetector nếu trình duyệt có, không thì smartcrop.js; lưu `photoFocus` trong guestStore), số liên hệ + mã vé (font **Cinzel** vì cần chữ số cao đều). 2 vé trong túi chéo. Khách có thể xoay ngang điện thoại để xem vé (màn xem vé làm sau).
  - Tường phía trên: chữ "nắng in lên tường" `components/WallTitle` (Graduation Gala · 2026 · Dành riêng cho + biệt danh; Anime.js quét sáng + hiện từng ký tự) + bụi lấp lánh trong nắng `components/DustMotes` (canvas 2D).
  - Timeline `animations/gsap/maleDocumentTimeline.ts`: enter (kính co thành mặt bìa ở mép dưới → tập trồi lên) · open (bìa lật quanh gáy, camera lùi, 2 vé DỰNG ĐỨNG nhích lên nhưng vẫn cắm SÂU trong túi — chỉ lộ đầu vé, giấu ảnh) · ticketReveal · tap.
  - Chạm 2 lần (Hiệp muốn bất ngờ): `MALE_WAITING_TAP` –chạm "CHẠM ĐỂ MỞ"→ `TICKET_REVEAL` (vé chính rút khỏi túi, bay lên phóng to giữa màn) → vé 3D đổi vai sang vé DOM nét (`ticketFocusTimeline`, FLIP theo hình chiếu vé 3D), nền phía sau mờ (`.male__veil` backdrop-filter), vé phóng to ~76% chiều cao → `TICKET_VIEW` (vé to ~86% chiều cao, "VUỐT SANG PHẢI ĐỂ XEM THIỆP ›››" + gợi ý xoay ngang) –**vuốt phải** → `INVITATION_ENTER`: `maleToInvitationTimeline` — vé thu về & cắm lại vào túi (đảo 2 timeline), bìa hạ phẳng, camera LIA TRÁI + dựng thẳng + ZOOM từ từ vào thiệp bên trái (rig: lookX/lookY/tilt/fit, đích tính từ rect `.inv__paper`) → nền nhung đỏ đô hiện dần QUANH khung giấy (mặt nạ khoét lỗ, `velvetAround`) trong lúc camera sắp chạm khung (không lộ dải tối phía trên) → thiệp 3D (texture `drawInvitationCard` = cùng giấy + chữ header, khung lá để trống, tỉ lệ 0.47) đổi vai sang thiệp DOM, nội dung trang 1 + dấu sáp hiện dần → `INVITATION_VIEW`. (`pageSwipe.ts` không còn dùng.) Trang thiệp `scenes/InvitationScene` theo mẫu Hiệp (26/09): nền nhung đỏ đô `invitation/burgundy.webp`, giấy dó nhành lá `invitation/paper.webp` (background 100% 100%), dấu sáp `invitation/seal.webp` (cắt từ E1); header cố định theo mẫu (C thư pháp + CHÂN THÀNH KÍNH MỜI · LỄ VINH DANH · GRADUATION GALA 2026 · TÊN NGƯỜI ĐƯỢC MỜI + TÊN IN HOA màu vàng nâu; vị trí/cỡ chữ ở `InvitationScene/inviteHeader.ts`, dùng chung với texture thiệp 3D) · dấu sáp to, 1/3 thò ra mép trên · nội dung cuộn: mỗi mục là 1 đoạn KHÔNG khung/nền (chữ in thẳng lên giấy — Hiệp không muốn khung từng khối), `scroll-snap-type: y mandatory` (dừng tay → về ô gần nhất), ô xa mờ + lùi nhẹ (rAF) (5 mục, đếm ngược, lời chúc, RSVP — tạm lưu localStorage, Phase 12 nối Supabase). Icon nét mảnh, không emoji.
  - Vé: chữ HOST/CONTACT/VENUE/địa chỉ do code điền (template đã xoá chữ cũ), font chọn ở `TICKET_TYPE` trong `Ticket/drawTicket.ts` — Hiệp chọn **EB Garamond** (bộ 3). Hiệu ứng rút vé: 1 đường tăng tốc (3D) → giảm tốc (DOM) liền mạch.
  - Xoay ngang điện thoại ở `TICKET_VIEW` → vé ngang phủ toàn màn hình (`.ticket-land`, portal ra body).
  - Kiểm thử: thêm `?qa` vào URL → tắt lagSmoothing GSAP + lộ `window.__maleEnter/__maleOpen` để tua từng khung.
- ⏭️ Phase 6 (còn lại): đồng bộ Supabase (upload ảnh, `register_guest` cấp mã vé chính thức)
- Sau đó: 7 Nam · 8 Nữ · 9 Vé · 10 Thiệp · 11 Z-fold · 12 Các mục cuộn · 14 Tối ưu · 15 Test mobile + deploy
- Dữ liệu đang **mock** (SĐT liên hệ, lời mời) — Hiệp sẽ cung cấp thật sau.

## Cách làm việc với Hiệp
- Làm **từng bước**, xong bước nào cho xem bước đó. Khi Hiệp nói "chưa code" thì chỉ bàn/viết tài liệu.
- Trước khi báo xong: `npm run build` pass; nếu sửa giao diện thì chụp màn hình kiểm tra ở 375×667, 390×844, 430×932.
- Hiệp đánh giá cao **độ thật như ảnh chụp** — ghép ảnh + 3D phẳng từng bị chê "xấu". Đừng đưa bản thử kém chất lượng như thể là kết quả cuối.
