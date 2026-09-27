# Kiến trúc dự án: Thiệp mời Graduation Gala 2026

> Bản 2, ngày 24/09/2026. Bản này bỏ Node/Express, chuyển sang Supabase + Vercel và vá 5 điểm yếu của bản 1.
> Sơ đồ viết bằng Mermaid, xem được trên GitHub hoặc trong VS Code (cần extension "Markdown Preview Mermaid Support").

**Mục tiêu vận hành:** dự án chỉ dùng cho một dịp duy nhất. Vì vậy chọn cách đơn giản nhất có thể:

- Không có server riêng.
- Deploy một web tĩnh lên Vercel.
- Dữ liệu khách lưu trên Supabase.
- Xong sự kiện thì xoá cả project cho sạch.

---

## 1. Tổng quan hệ thống

```mermaid
flowchart LR
  subgraph Phone["📱 Điện thoại khách"]
    UI["React + Vite<br/>giao diện · state"]
    GL["1 Canvas Three.js duy nhất<br/>vật thể 3D"]
    LS[("localStorage<br/>hồ sơ + ảnh nhỏ")]
  end
  subgraph Vercel["▲ Vercel (web tĩnh, miễn phí)"]
    DIST["dist/ + public/assets<br/>HTML · JS · ảnh · model .glb"]
  end
  subgraph Supabase["⚡ Supabase · thiep-moi-graduation-gala"]
    RPC["3 hàm ghi dữ liệu<br/>register_guest · submit_rsvp · submit_wish"]
    DB[("Postgres<br/>guests · rsvps · wishes")]
    ST[("Storage<br/>guest-photos (riêng tư)")]
  end
  Admin["👤 Hiệp<br/>Supabase Dashboard"]

  DIST -->|tải trang| UI
  UI <--> GL
  UI <--> LS
  UI -->|"gọi hàm (chỉ ghi)"| RPC --> DB
  UI -->|upload ảnh| ST
  Admin -->|xem / xuất CSV| DB
  Admin --> ST
```

**Bảo mật dữ liệu khách** (SĐT, CCCD, ảnh):

- Khoá dùng ở web là khoá *publishable*, được phép công khai.
- Khách chỉ **ghi** được qua 3 hàm. Khách **không đọc** được bảng nào, kể cả dữ liệu của chính mình. Các bảng đều bật RLS và không có policy đọc.
- Ảnh chỉ upload được, không xem được từ web.
- Chỉ Hiệp xem dữ liệu, qua Supabase Dashboard: Table Editor → `guest_overview`.
- Vé hiển thị ảnh từ bản sao đã nén lưu ngay trên máy khách, nên không cần đọc ngược lên server.

---

## 2. Hành trình khách mời (state machine)

State machine nằm trong `src/state/experienceMachine.ts`. Có hai sự kiện chuyển trạng thái chính:

- `DONE`: timeline GSAP của bước đó chạy xong (gọi trong `onComplete`).
- `TAP`: khách chạm vào vật thể.

```mermaid
stateDiagram-v2
  direction TB
  [*] --> BOOT
  BOOT --> CALL_IDLE: khách mới
  BOOT --> INVITATION_VIEW: đã đăng ký (tải lại trang)
  CALL_IDLE --> CALL_DRAGGING: bắt đầu kéo
  CALL_DRAGGING --> CALL_IDLE: thả tay < 80%
  CALL_DRAGGING --> CALL_ANSWERED: kéo ≥ 80–85%
  CALL_ANSWERED --> RSVP_OPEN: DONE
  RSVP_OPEN --> RSVP_SUBMITTING: GỬI THÔNG TIN
  RSVP_SUBMITTING --> RSVP_OPEN: lỗi mạng → báo lỗi, giữ dữ liệu
  RSVP_SUBMITTING --> MALE_DOCUMENT_ENTER: Nam
  RSVP_SUBMITTING --> FEMALE_LETTER_TRANSFORM: Nữ

  state "Nhánh NAM" as Male {
    MALE_DOCUMENT_ENTER --> MALE_DOCUMENT_OPEN: DONE
    MALE_DOCUMENT_OPEN --> MALE_WAITING_TAP: DONE (vé nhô lên trong folder)
  }

  state "Nhánh NỮ" as Female {
    FEMALE_LETTER_TRANSFORM --> FEMALE_ENVELOPE_INSERT: DONE
    FEMALE_ENVELOPE_INSERT --> FEMALE_ENVELOPE_CLOSED: DONE
    FEMALE_ENVELOPE_CLOSED --> FEMALE_SCENE_TRANSITION: DONE
    FEMALE_SCENE_TRANSITION --> FEMALE_SCENE_READY: DONE
    FEMALE_SCENE_READY --> FEMALE_WAITING_TAP: DONE
    FEMALE_WAITING_TAP --> FEMALE_ENVELOPE_OPEN: TAP
    FEMALE_ENVELOPE_OPEN --> TICKET_REVEAL: DONE
    TICKET_REVEAL --> LETTER_REVEAL: DONE
  }

  MALE_WAITING_TAP --> INVITATION_VIEW: TAP
  LETTER_REVEAL --> INVITATION_VIEW: TAP (vé dịch phải, thiệp trượt trái)
  INVITATION_VIEW --> INVITATION_DETAIL: mở chi tiết
  INVITATION_DETAIL --> INVITATION_VIEW: đóng
```

### Quy tắc chống lỗi (vá điểm yếu số 3)

| Tình huống | Cách xử lý |
|---|---|
| Khách tải lại trang giữa chừng | Trạng thái `BOOT` đọc localStorage. Nếu khách đã có mã vé thì vào thẳng `INVITATION_VIEW`. Nếu chưa gửi form thì quay về màn cuộc gọi, form vẫn giữ những gì đã điền. |
| Khách chạm liên tục khi hiệu ứng đang chạy | Mỗi trạng thái chỉ nhận đúng sự kiện của nó. Ví dụ `TAP` chỉ có tác dụng ở `*_WAITING_TAP`. Các sự kiện không hợp lệ bị bỏ qua. |
| Khách bấm Gửi 2 lần | Hàm `register_guest` nhận `id` do máy khách tạo sẵn. Gửi lại cùng `id` thì nhận lại mã vé cũ, không tạo vé mới. |
| Mất mạng lúc gửi | Ở lại `RSVP_OPEN`, báo lỗi và giữ nguyên dữ liệu. Không chạy hiệu ứng khi dữ liệu chưa lưu xong. |
| Máy yếu, hoặc bật "Giảm chuyển động" | Dùng timeline rút gọn: vẫn giữ đúng thứ tự vật thể, nhưng ngắn hơn, bỏ parallax và bỏ bóng đổ động. |

---

## 3. Luồng dữ liệu khách

```mermaid
flowchart TD
  F["GlassPopup<br/>10 ô + ảnh"] -->|"1 · nén ảnh ~600px"| IMG["ảnh nhỏ (JPEG ~80%)"]
  F -->|"2 · crypto.randomUUID()"| ID["guestId"]
  IMG -->|"3 · upload guest-photos/{guestId}/photo.jpg"| ST[("Supabase Storage")]
  ID --> RPC["4 · rpc register_guest(...)"]
  RPC -->|"trả về mã vé GH26-0001"| G["guestStore (zustand)<br/>hồ sơ + ticketNo + ảnh nhỏ"]
  G -->|persist| LS[("localStorage")]
  E["config/event.ts<br/>đọc VITE_EVENT_* từ .env"] --> T
  G -->|derive| T["TicketData"]
  T --> TK["&lt;Ticket /&gt; dùng chung"]
  TK --> M["Nhánh Nam · trong folder"]
  TK --> W["Nhánh Nữ · trong phong bì"]
  G -->|nickname| INV["InvitationScene · gõ chữ biệt danh"]
  G -->|gender| SM["experienceMachine · chọn nhánh"]
  INV -->|"rpc submit_rsvp / submit_wish"| DB[("Supabase Postgres")]
```

**Mã vé** do database cấp theo thứ tự (`GH26-0001`, `GH26-0002`...), nên không bao giờ trùng giữa hai khách.

### Cơ sở dữ liệu

Toàn bộ nằm trong `supabase/schema.sql` và đã được áp dụng.

```mermaid
erDiagram
  guests ||--o{ rsvps : "xác nhận"
  guests ||--o{ wishes : "lời chúc"
  guests {
    uuid id PK
    text ticket_no UK "GH26-0001"
    text full_name
    text nickname
    text phone
    text cccd
    text gender "nam | nu"
    text email
    date dob
    text hobbies
    text description
    text photo_path
    timestamptz created_at
  }
  rsvps {
    bigint id PK
    uuid guest_id FK
    text status "attending | not_attending | maybe"
    timestamptz created_at
  }
  wishes {
    bigint id PK
    uuid guest_id FK
    text message
    timestamptz created_at
  }
```

---

## 4. Phân vai thư viện (mỗi thuộc tính chỉ một "chủ")

```mermaid
flowchart LR
  R["React + zustand<br/>state · dữ liệu"] -->|"trạng thái hiện tại"| G["GSAP<br/>timeline · kéo · chuyển cảnh · cuộn"]
  G -->|"onComplete → send(DONE)"| R
  G -->|"position / rotation của mesh"| TH["Three.js / R3F<br/>mesh · vật liệu · ánh sáng · camera"]
  A["Anime.js<br/>gõ chữ · lấp lánh"] -.->|chỉ chữ & chi tiết nhỏ| DOM["DOM"]
  C["CSS<br/>layout · font · kính mờ"] -.->|style tĩnh| DOM
  G -->|"transform / opacity"| DOM
  SB["supabase-js"] -.->|chỉ gọi khi submit| R
```

| Thứ cần điều khiển | Chủ sở hữu | Không được |
|---|---|---|
| Vị trí, xoay, scale của vật thể | GSAP | Dùng CSS transition hoặc Anime.js trên cùng thuộc tính |
| Vật liệu, ánh sáng, bóng đổ 3D | Three.js / R3F | Dùng React `setState` ở mỗi khung hình |
| Gõ chữ biệt danh, chữ hiện dần, lấp lánh | Anime.js | Điều khiển timeline chính |
| Bố cục, font, style tĩnh | CSS | Viết chuỗi chuyển cảnh bằng keyframes |
| Đang ở bước nào, dữ liệu khách | React (zustand) | Chạy animation từng frame |

---

## 5. Một canvas + cầu nối DOM ↔ 3D (vá điểm yếu số 1)

Bản 1 đặt `TransitionLayer` là một lớp HTML riêng. Cách này không dùng được, vì phong bì, folder và vé là vật thể 3D sống trong WebGL, không thể "nhấc" chúng lên một lớp HTML.

Bản 2 xử lý như sau:

- **Chỉ có 1 `<Canvas>`** phủ toàn màn hình, được tạo 1 lần duy nhất trong `ExperienceCanvas` và không bao giờ unmount. Làm vậy để tránh lỗi "WebGL Context Lost" từng gặp ở bản cũ.
- **Mỗi cảnh là một nhóm (`<group>`) trong cùng canvas.** Chuyển cảnh nghĩa là GSAP di chuyển group, hoặc camera. Không có chuyện huỷ canvas rồi tạo lại.
- **Cầu nối DOM ↔ 3D** nằm ở `src/three/domBridge.ts`:
  - Đọc `getBoundingClientRect()` của một phần tử HTML (popup, hoặc anchor `#ticket-target`), đổi sang toạ độ và kích thước trong thế giới 3D ở một độ sâu cho trước.
  - Dùng khi popup (HTML) biến thành lá thư (3D): lá thư xuất hiện đúng kích thước và vị trí của popup, rồi GSAP cho nó bay đi.
  - Chạy ngược lại khi cần đặt chữ HTML khớp lên trên vật thể 3D.
- `TransitionLayer` (HTML) giờ chỉ còn giữ **chữ và nút** tạm thời trong lúc chuyển cảnh, ví dụ dòng CTA "CHẠM VÀO THƯ ĐỂ MỞ".

```mermaid
flowchart TB
  subgraph Screen["Màn hình (z-index tăng dần ↓)"]
    L0["Lớp 0 · Canvas Three.js DUY NHẤT<br/>ảnh nền (plane) + mọi vật thể 3D + đổi cảnh bằng group/camera"]
    L1["Lớp 1 · Scene UI HTML<br/>popup kính mờ · thiệp cuộn · nút"]
    L2["Lớp 2 · TransitionLayer HTML<br/>chữ CTA / chữ tạm khi chuyển cảnh"]
  end
  L0 --- L1 --- L2
  B["domBridge.ts<br/>DOM rect ⇄ toạ độ 3D"] -.-> L0
  B -.-> L1
```

---

## 6. Tải trước asset (vá điểm yếu số 2)

```mermaid
sequenceDiagram
  participant K as Khách
  participant W as Web
  participant C as Vercel CDN
  K->>W: Mở link
  W->>C: Tải ưu tiên: ảnh màn cuộc gọi + font (≈ 300–500 KB)
  W-->>K: Màn cuộc gọi hiện ngay
  K->>W: Vuốt nghe máy → mở form
  par Trong lúc khách điền form (thường 1–2 phút)
    W->>C: Tải ngầm model + texture CHUNG (vé, giấy)
  and
    W->>C: Khách vừa chọn giới tính → tải ngầm asset của đúng nhánh đó
  end
  K->>W: Bấm Gửi
  Note over W: Asset đã sẵn → chuyển cảnh không khựng
  W->>W: Nếu vẫn chưa tải xong → giữ hiệu ứng "đang gửi" thêm tối đa 2–3s rồi mới chạy
```

- Dùng `useGLTF.preload()` và `useTexture.preload()` của drei, gọi trong `src/three/preload.ts` theo từng giai đoạn.
- Khách **chỉ tải asset của nhánh mình**. Khách Nam không tải cảnh tulip, nên đỡ tốn dung lượng cho cả hai nhánh.

---

## 7. Ngân sách hiệu năng điện thoại (vá điểm yếu số 4)

| Hạng mục | Quy định |
|---|---|
| Tổng dung lượng mỗi nhánh | ≤ 8 MB (lần đầu), ảnh nền ≤ 400 KB/ảnh |
| Model `.glb` | Nén **Meshopt** hoặc **Draco**, ≤ 50k tam giác cho mỗi cảnh |
| Texture | ≤ 2048 px. Dùng **KTX2** (nén trên GPU) khi có thể, nếu không thì WebP |
| Bóng đổ | Dùng bóng "nướng" sẵn vào texture, cộng `ContactShadows` của drei. **Không** bật shadow map thời gian thực cho quá 1 đèn |
| Độ phân giải canvas | `dpr={[1, 2]}`, tự hạ xuống khi FPS thấp (`PerformanceMonitor` của drei) |
| Vòng vẽ | `frameloop="demand"`: canvas chỉ vẽ khi có chuyển động. Cảnh đứng yên thì GPU nghỉ, máy đỡ nóng |
| Chế độ `low` | Bỏ parallax và cánh hoa bay, giảm số đèn, dùng ảnh 2.5D thay model nặng |

---

## 8. Deploy: Vercel (vá điểm yếu số 5)

```mermaid
flowchart LR
  Dev["Máy Hiệp<br/>C:\\Project\\Thiep_moi"] -->|git push| GH["GitHub repo"]
  GH -->|tự build mỗi lần push| V["Vercel<br/>npm run build → dist/"]
  V --> URL["https://ten-du-an.vercel.app<br/>(gửi link cho khách)"]
  V -.->|"biến môi trường VITE_* (nhập trên Vercel)"| V
```

1. Đẩy code lên GitHub.
2. Trên vercel.com chọn *Add New Project*, chọn repo. Vercel tự nhận ra Vite.
3. Vào *Settings → Environment Variables*, nhập các biến giống `.env.local`.
4. Mỗi lần push, Vercel tự build lại. `vercel.json` đã cấu hình sẵn cache cho asset và rewrite để tải lại trang không bị lỗi 404.

**Sau sự kiện:**

1. Xuất CSV khách, RSVP và lời chúc từ Supabase nếu muốn giữ lại.
2. Xoá project Supabase để dữ liệu cá nhân của khách không còn nằm trên mạng.
3. Tắt hoặc xoá project Vercel.

---

## 9. Cây thư mục

```
Thiep_moi/
├── index.html                 # khung HTML, font Google (Cormorant, Great Vibes, Inter)
├── vite.config.ts             # alias @ → src, tách chunk three/motion
├── vercel.json                # cấu hình deploy Vercel
├── .env.example               # Supabase + thông tin sự kiện (copy → .env.local)
├── docs/ARCHITECTURE.md       # tài liệu này
├── supabase/schema.sql        # bảng + hàm + bucket ảnh (đã áp dụng)
├── public/assets/
│   ├── backgrounds/           # call-scene.webp, female-flower-scene.webp, male-document-scene.webp
│   ├── male/                  # folder-front/back, invitation, airplane-ticket
│   ├── female/                # envelope-front/back/flap, letter, bouquet
│   ├── tickets/               # texture giấy vé, hoạ tiết
│   ├── documents/             # giấy thư mời, 3 tấm Z-fold
│   ├── flowers/               # tulip, cánh hoa rời
│   ├── models/                # *.glb đã nén
│   ├── textures/              # vân giấy, marble, vải
│   └── fonts/                 # font thư pháp tiếng Việt .woff2 (nếu có)
└── src/
    ├── app/                   # App.tsx (gắn Canvas + UI), routes.tsx
    ├── config/                # event.ts: đọc VITE_EVENT_*
    ├── api/                   # supabase.ts (client), guests.ts, rsvp.ts, wishes.ts
    ├── lib/                   # gsap.ts: đăng ký Draggable, MotionPath, ScrollTrigger
    ├── state/                 # experienceMachine.ts, guestStore.ts
    ├── hooks/                 # useSwipeAnswer, useGuestData, useResponsive, useReducedMotion, useQuality
    ├── utils/                 # geometry, animation, localStorage, device, image (nén ảnh)
    ├── styles/                # tokens.css, global.css
    ├── components/            # CallScreen, SlideToAnswer, GlassPopup, Ticket, DocumentFolder,
    │                          # Letter, Envelope, ZFoldInvitation, Bouquet, TransitionLayer
    ├── scenes/                # CallScene, RSVPScene, MaleScene, FemaleScene, InvitationScene
    ├── animations/
    │   ├── gsap/              # callTimeline, popupTimeline, maleDocumentTimeline, femaleLetterTimeline,
    │   │                      # femaleEnvelopeTimeline, femaleSceneTransition, invitationTimeline, scrollTimeline
    │   └── anime/             # typewriter, textReveal, microInteractions
    └── three/                 # ExperienceCanvas, CameraRig, Lighting, Environment,
                               # domBridge.ts, preload.ts, models/
```

---

## 10. Thứ tự làm

Phase 13 cũ (Node API) đã được thay bằng Supabase, và database đã xong.

```mermaid
flowchart LR
  P1["1 Setup ✅"] --> P2["2 Design system"] --> P3["3 Call screen"] --> P4["4 Swipe"] --> P5["5 Popup"]
  P5 --> P6["6 Guest data + upload<br/>(nối Supabase)"] --> P7["7 Nhánh Nam"] --> P8["8 Nhánh Nữ"] --> P9["9 Ticket"]
  P9 --> P10["10 Invitation"] --> P11["11 Z-fold"] --> P12["12 Scroll sections<br/>RSVP · lời chúc"] --> P13["13 Supabase ✅"]
  P13 --> P14["14 Tối ưu"] --> P15["15 Test mobile + deploy Vercel"]
```

---

## 11. Giới hạn cần biết

Kiến trúc chỉ đảm bảo trải nghiệm **mượt và không vỡ**. Độ "như ảnh chụp thật" phụ thuộc chủ yếu vào chất lượng asset: model, texture PBR, ảnh tách lớp. Asset cho vật thể nào cần gấp, mở hoặc bị che thì phải tách lớp hoặc làm dạng 3D. Không dùng một ảnh PNG phẳng cho những vật thể đó.
