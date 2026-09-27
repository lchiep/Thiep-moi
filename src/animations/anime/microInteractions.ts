import { animate, createScope, type Scope } from 'animejs'

/**
 * Chuyển động nhỏ màn cuộc gọi (Anime.js).
 * Chỉ điều khiển phần tử con bên trong (icon), KHÔNG đụng transform của
 * các khối lớn mà GSAP đang giữ.
 */
export function callMicroInteractions(root: HTMLElement): Scope {
  return createScope({ root }).add(() => {
    // Remind Me: lơ lửng nhẹ + rung khẽ
    animate('[data-float="remind"]', {
      translateY: [-2.5, 2.5],
      duration: 2200,
      ease: 'inOutSine',
      loop: true,
      alternate: true,
    })
    animate('[data-float="remind"] svg', {
      keyframes: [
        { rotate: -9, duration: 70 },
        { rotate: 8, duration: 70 },
        { rotate: -6, duration: 70 },
        { rotate: 5, duration: 70 },
        { rotate: 0, duration: 90 },
      ],
      loop: true,
      loopDelay: 2600,
      ease: 'inOutSine',
    })

    // Message: cùng kiểu nhưng lệch pha
    animate('[data-float="message"]', {
      translateY: [2.5, -2.5],
      duration: 2600,
      ease: 'inOutSine',
      loop: true,
      alternate: true,
      delay: 500,
    })
    animate('[data-float="message"] svg', {
      keyframes: [
        { rotate: 7, duration: 80 },
        { rotate: -6, duration: 80 },
        { rotate: 4, duration: 80 },
        { rotate: 0, duration: 100 },
      ],
      loop: true,
      loopDelay: 3300,
      delay: 1400,
      ease: 'inOutSine',
    })

    // Icon điện thoại "reo": rung dồn dập rồi nghỉ
    animate('[data-ring]', {
      keyframes: [
        { rotate: -16, duration: 60 },
        { rotate: 16, duration: 60 },
        { rotate: -14, duration: 60 },
        { rotate: 14, duration: 60 },
        { rotate: -10, duration: 60 },
        { rotate: 10, duration: 60 },
        { rotate: 0, duration: 80 },
      ],
      loop: true,
      loopDelay: 1100,
      ease: 'inOutQuad',
    })
  })
}

/**
 * Nút "Gửi lời chúc" lắc nhẹ gợi ý (khi khách chọn "Không đi được").
 * Lắc trên lớp BỌC ngoài nút (nút giữ transform riêng cho hiệu ứng bấm của CSS).
 */
export function nudgeShake(el: HTMLElement): Scope {
  return createScope({ root: el }).add(() => {
    animate(el, {
      keyframes: [
        { translateX: -5, rotate: -1.2, duration: 80 },
        { translateX: 5, rotate: 1.2, duration: 80 },
        { translateX: -4, rotate: -0.8, duration: 80 },
        { translateX: 3, rotate: 0.6, duration: 80 },
        { translateX: 0, rotate: 0, duration: 110 },
      ],
      loop: true,
      loopDelay: 1800,
      ease: 'inOutSine',
    })
  })
}
