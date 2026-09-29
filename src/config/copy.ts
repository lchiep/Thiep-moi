/**
 * Nội dung chữ trên thiệp — BẢN NHÁP TẠM (mock).
 * Hiệp sửa trực tiếp ở file này khi có nội dung thật.
 */
export const COPY = {
  call: {
    badge: 'CUỘC GỌI ĐẾN',
    title: 'Graduation Gala',
    subtitle: 'Special Invitation',
    remind: 'Remind Me',
    message: 'Message',
    slide: 'slide to answer',
  },

  // lời nhắn + hướng dẫn từng ô, hiện khi popup vừa mở (nút × để bỏ qua)
  rsvpIntro: {
    welcome: [
      '✨ Em xin phép A/c dành một chút thời gian để điền đầy đủ thông tin ',
      '💌 Những thông tin này sẽ giúp hành trình phía sau trở nên thú vị hơn và có thêm một vài điều bất ngờ dành riêng cho anh/chị. ',
    ],
    start: 'Xem hướng dẫn',
    skipHint: 'Tap 2 lần để bỏ qua',
    /** dòng đỏ cạnh nhãn khi nhập sai định dạng */
    phoneError: '*Bạn đã nhập sai số điện thoại → 0*********',
    /** khu "Ảnh của bạn" */
    photo: {
      empty: 'Hãy up ảnh 😍✨ của mk lên',
      repick: 'Chọn lại',
      view: 'Xem ảnh to',
      viewHint: 'Bạn có thể chọn ảnh khác để dùng nhé 😍',
      close: 'Chạm để thu nhỏ',
    },
    back: 'Quay lại',
    next: 'Tiếp theo',
    done: 'Bắt đầu điền',
    fix: 'Điền ngay',
    // key trùng với data-tour trên từng ô của form
    tour: [
      { key: 'fullName', title: 'Họ và tên', body: 'Họ tên đầy đủ của anh/chị — đây sẽ được dùng cho mục đích chính ✨' },
      { key: 'nickname', title: 'Tên gọi thân mật', body: 'Đây sẽ là item đặc biệt dành riêng cho anh/chị ✨' },
      { key: 'phone', title: 'Số điện thoại', body: 'SĐT là item quan trọng cho tương lai ✨ ' },
      { key: 'cccd', title: 'CCCD', body: 'Không bắt buộc — anh/chị có thể để trống.' },
      { key: 'gender', title: 'Giới tính', body: 'Mỗi lựa chọn sẽ mở ra một hành trình khác nhau đó ✨' },
      { key: 'email', title: 'Email', body: 'Item này vô cùng cần thiết cho vài ngày tới đó ạ ✨ ' },
      { key: 'dob', title: 'Ngày sinh', body: 'Không bắt buộc — biết đâu lại có một bất ngờ nho nhỏ.' },
      { key: 'hobbies', title: 'Sở thích', body: 'Không bắt buộc — kể một chút để em hiểu anh/chị hơn.' },
      { key: 'description', title: 'Giới thiệu bản thân', body: 'Giới thiệu bản thân một chút nhé!' },
      { key: 'photo', title: 'Ảnh Face-Card', body: 'Face-Card sắp tới là 1 món quà bất ngờ ngay phía sau đó ạ 😉✨)' },
    ],
  },

  male: {
    cta: 'CHẠM VÀO VÉ HOẶC THIỆP',
    ctaInvite: 'VUỐT SANG PHẢI ĐỂ XEM THIỆP',
    stowHint: '↓ Vuốt xuống để cất vé',
    rotateHint: 'Xoay ngang điện thoại để xem vé rõ hơn',
    // chữ "nắng in lên tường" phía trên tập tài liệu
    wallTitle: 'Graduation Gala',
    wallFor: 'Dành riêng cho',
  },

  female: {
    // chữ trên lá thư (popup biến thành thư → vào phong bì)
    letterTitle: 'Graduation Gala',
    letterTo: 'Gửi',
    letterDate: '16 · 10 · 2026',
    // cảnh tulip: chờ khách chạm vào phong bì
    cta: 'CHẠM VÀO THƯ ĐỂ MỞ',
    // phong bì đã mở: rút vé ra xem (như nhánh Nam) → vuốt lên để đảo bài vé ↔ thư
    cardsHint: 'CHẠM HOẶC VUỐT LÊN ĐỂ XEM VÉ',
    ticketHint: 'VUỐT ĐỂ XEM THƯ MỜI',
    letterHint: 'VUỐT LÊN ĐỂ XEM VÉ',
    stowHint: '↓ Vuốt xuống để cất vào phong bì',
    ticketAlt: 'Vé mời Graduation Gala 2026',
    letterAlt: 'Thư mời Graduation Gala 2026',
  },

  invitationHeader: {
    kicker: 'CHÂN THÀNH KÍNH MỜI',
    title: 'LỄ VINH DANH',
    subtitle: 'GRADUATION GALA 2026',
    // 3 dòng khách: TRÂN TRỌNG KÍNH MỜI → HỌ VÀ TÊN (in hoa) → "Anh/Chị + tên gọi thân mật" (thư pháp)
    guestLabel: 'TRÂN TRỌNG KÍNH MỜI',
    honorific: { nam: 'Anh', nu: 'Chị' },
    /** nút nhỏ góc trái dưới màn thiệp: quay lại tập hồ sơ */
    back: '← Quay lại',
  },

  // 5 "trang" nội dung thiệp — mỗi lần chỉ hiện 1 trang trong vùng cuộn, cuộn xuống mới sang trang sau
  sections: {
    letter: {
      no: '01',
      icon: '✉️',
      title: 'LỜI MỜI THÂN MẬT',
      heading: 'Lời Mời Thân Mật',
      body: [
        'Sau một chặng đường học tập và trưởng thành, mình sắp bước đến một cột mốc thật đặc biệt.',
        'Trong hành trình ấy, mình may mắn được gặp gỡ, đồng hành và nhận được rất nhiều sự quan tâm từ những người bạn, người thân và những anh chị đã từng ở bên mình trong những chặng đường khác nhau.',
        'Vì vậy, mình rất mong có thể cùng mọi người chia sẻ niềm vui trong ngày đặc biệt này và lưu lại thêm một kỷ niệm đẹp trước khi bước sang một hành trình mới.',
      ],
      note: 'Có bạn, ngày này sẽ trở nên trọn vẹn hơn rất nhiều.',
    },
    timePlace: {
      no: '02',
      icon: '🕒',
      title: 'THỜI GIAN & ĐỊA ĐIỂM',
      heading: 'Thời Gian & Địa Điểm',
      timeLabel: 'THỜI GIAN',
      time: '1:00 PM · Friday, October 16, 2026', // Hiệp: viết kiểu tiếng Anh
      placeLabel: 'ĐỊA ĐIỂM',
      greeterLabel: 'LỄ TÂN_PHỤC VỤ',
      note: 'Đừng đến quá muộn nhé — mình muốn có bạn trong khoảnh khắc của ngày hôm ấy.',
    },
    schedule: {
      no: '03',
      icon: '⏳',
      title: 'LỊCH TRÌNH & LỜI CHÚC',
      heading: 'Chờ đón khoảnh khắc',
      units: ['THÁNG', 'NGÀY', 'GIỜ', 'PHÚT', 'GIÂY'],
      mapButton: 'XEM BẢN ĐỒ',
      note: 'Mình đang đếm từng ngày để được gặp bạn.',
    },
    guide: {
      no: '04',
      icon: '📌',
      title: 'HƯỚNG DẪN KHÁCH MỜI',
      heading: 'Hướng Dẫn Khách Mời',
      intro: 'Để buổi lễ diễn ra thật thoải mái, chúng ta sẽ cùng nhau chuẩn bị một vài điều nho nhỏ trước khi gặp nhau nhé!!!',
      dress: {
                label: 'TRANG PHỤC',
        colors: [
          { name: 'Đen', hex: '#1d1b19' },
          { name: 'Be', hex: '#d8c3a0' },
          { name: 'Trắng', hex: '#faf7f1' },
        ],
        text: 'Ưu tiên sự thoải mái, gọn gàng và một chút “Lên hình thật đẹp”.',
      },
      photo: { label: 'CHỤP ẢNH', text: 'Mọi người có thể lên sớm để làm vài bức trước hoặc đợi sau khi trao bằng rồi mình sẽ dành thời gian cho nhau nhé' },

      note: 'Đừng quên lựa chọn một trang phục phù hợp với thời tiết để có một sức khỏe tốt nhé!',
    },
    rsvp: {
      no: '05',
      icon: '📝',
      title: 'XÁC NHẬN THAM DỰ',
      wishButton: 'GỬI LỜI CHÚC',
      wishPlaceholder: 'Hãy để lại một lời nhắn/kỷ niệm đáng nhớ nhất của bạn với mình nhé!',
      wishSend: 'GỬI',
      wishDone: 'Đã nhận lời chúc — cảm ơn bạn ♡',
      heading: 'Xác Nhận Tham Dự',
      intro: 'Mình đang háo hức chuẩn bị cho ngày này, và sẽ thật tuyệt nếu bạn có thể xuất hiện ở đó.',
      question: 'Bạn sẽ đến chứ?',
      options: [
        { value: 'attending', label: 'Sẽ tham dự cùng bạn', reply: 'Hẹn gặp nhau tại buổi lễ nhé.' },
        { value: 'maybe', label: 'Sẽ thu xếp', reply: 'Mình sé giữ một slot thật đẹp cho bạn.' },
        { value: 'not_attending', label: 'Không đi được', reply: 'Tiếc quá, vậy cảm ơn bạn đã kết nối với tôi nhé' },
      ],
      button: 'GỬI XÁC NHẬN',
      thanks: 'Cảm ơn bạn nhé ♡',
      thanksSub: 'Mình đã nhận được câu trả lời của bạn rồi.',
      end: '— Hẹn gặp bạn —',
    },
  },

  /**
   * LUẬT RIÊNG theo tên khách: họ và tên có ĐÚNG chữ `nameWord` (so cả chữ, không phân biệt hoa/thường) →
   *  - xưng hô trên thiệp = `honorific` + biệt danh (thay cho Anh/Chị), vd. "Nguyễn Thị Bích Hằng" + "Hằng" → "Bé Hằng"
   *  - chữ trong thư dùng `sections` thay cho bản chung (chỉ cần ghi những dòng khác; dòng nào không ghi → dùng bản chung)
   */
  specialGuests: [
    {
      nameWord: 'Hằng',
      honorific: 'Bé',
      // xưng hô trong thư: ANH – BÉ
      sections: {
        letter: {
          body: [
            'Sau những ngày bận rộn với đủ thứ công việc, những kế hoạch cứ nối tiếp nhau, cuối cùng anh cũng hoàn thành được một chặng đường mà anh đã dành nhiều thời gian và cố gắng.',
            'Và trong ngày đặc biệt ấy, anh muốn gửi riêng cho bé một lời mời. Bé không cần phải chuẩn bị gì đặc biệt, cũng chẳng cần phải làm gì cầu kỳ, chỉ cần có thể sắp xếp được thời gian và đến chung vui cùng anh trong ngày hôm ấy là đã đủ rồi.',
            'Anh biết ai cũng có công việc, lịch trình và những chuyện riêng của mình, nên nếu bé thu xếp được, anh rất mong sẽ được gặp bé ở đó. Anh hy vọng bé có thể dành một chút thời gian đến cùng anh, để ngày tốt nghiệp này có thêm một người mà anh thật sự muốn có mặt bên cạnh.',
          ],
          note: 'Có bé, ngày này sẽ trở nên trọn vẹn hơn rất nhiều.',
        },
        timePlace: { note: 'Đừng đến quá muộn nhé — anh muốn có bé trong khoảnh khắc của ngày hôm ấy.' },
        schedule: { note: 'Anh đang đếm từng ngày để được gặp bé.' },
        guide: {
          intro: 'Để ngày hôm đó thật thoải mái, bé hãy chuẩn bị 1 vài điều nho nhỏ trước khi gặp nhau nhé !!!',
          photo: { label: 'CHỤP ẢNH', text: 'Bé có thể lên sớm để chụp vài bức trước hoặc có thể lên sau để tránh mệt, khi đó anh sẽ có nhiều thời gian hơn.' },
        },
        rsvp: {
          wishPlaceholder: 'Hãy để lại một lời nhắn/kỷ niệm đáng nhớ nhất của bé với anh nhé!',
          wishDone: 'Anh đã nhận lời chúc — cảm ơn bé ♡',
          intro: 'Anh đang háo hức chuẩn bị cho ngày này, và sẽ thật tuyệt nếu bé có thể xuất hiện ở đó.',
          question: 'Bé sẽ đến chứ?',
          options: [
            { value: 'attending', label: 'Sẽ tham dự cùng anh', reply: 'Hẹn gặp bé tại buổi lễ nhé.' },
            { value: 'maybe', label: 'Sẽ thu xếp', reply: 'Anh sẽ giữ một chỗ thật đẹp cho bé.' },
            { value: 'not_attending', label: 'Không đi được', reply: 'Tiếc quá, vậy cảm ơn bé đã kết nối với anh nhé' },
          ],
          thanks: 'Cảm ơn bé nhé ♡',
          thanksSub: 'Anh đã nhận được câu trả lời của bé rồi.',
          end: '— Hẹn gặp bé —',
        },
      },
    },
  ],
} as const

/** Khách mẫu để xem thử giao diện khi chưa có dữ liệu thật. */
export const MOCK_GUEST = {
  fullName: 'Nguyễn Minh Chíp',
  nickname: 'Chíp',
  ticketNo: 'GH26-0001',
} as const
