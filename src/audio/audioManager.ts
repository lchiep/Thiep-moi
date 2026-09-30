import { gsap } from 'gsap'

/**
 * ÂM THANH toàn trang (1 bộ phát duy nhất, nằm NGOÀI các cảnh → nhạc không bị ngắt khi đổi cảnh).
 *  - Web Audio API (không dùng <audio>): iPhone không cho chỉnh `audio.volume`, nên muốn nhỏ dần/to dần
 *    mượt thì phải đi qua GainNode; vòng lặp cũng liền mạch hơn.
 *  - GSAP giữ MỌI đường nhỏ dần/to dần (không setTimeout); Web Audio chỉ phát.
 *  - Trình duyệt chỉ cho phát tiếng SAU cú chạm/vuốt đầu tiên của khách → mở khoá ở lần chạm đầu.
 *
 * File nằm ở public/assets/audio/ — muốn đổi bài chỉ cần thay file cùng tên (đổi `?v=` để khỏi dính cache).
 */
export type Track = 'ring' | 'music'

const SRC: Record<Track, string> = {
  ring: '/assets/audio/ringtone.mp3?v=2', // chuông điện thoại — màn cuộc gọi
  music: '/assets/audio/popup.mp3?v=1', // nhạc nền — popup nhập thông tin
}
/** độ to từng bài (0–1) */
const LEVEL: Record<Track, number> = { ring: 0.85, music: 0.5 }
const MUTE_KEY = 'gg26.mute'

type Voice = {
  bytes: ArrayBuffer | null
  buffer: AudioBuffer | null
  source: AudioBufferSourceNode | null
  gain: GainNode | null
  vol: { v: number }
  tween: gsap.core.Tween | null
}

class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private masterVol = { v: 1 }
  private masterTween: gsap.core.Tween | null = null
  private voices: Record<Track, Voice> = {
    ring: { bytes: null, buffer: null, source: null, gain: null, vol: { v: 0 }, tween: null },
    music: { bytes: null, buffer: null, source: null, gain: null, vol: { v: 0 }, tween: null },
  }
  private want: Track | null = null
  private fade = 0.8
  private unlocked = false
  private inited = false
  private listeners = new Set<() => void>()
  muted = false

  /** gọi 1 lần khi mở trang: nạp trước file, lắng nghe cú chạm đầu tiên. Trả về hàm dọn. */
  init() {
    if (this.inited) return () => {}
    this.inited = true
    try { this.muted = localStorage.getItem(MUTE_KEY) === '1' } catch { /* riêng tư: bỏ qua */ }
    ;(Object.keys(SRC) as Track[]).forEach((t) => {
      fetch(SRC[t])
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .then((b) => { this.voices[t].bytes = b; this.decodeIfReady() })
        .catch(() => { /* mạng lỗi: trang vẫn chạy, chỉ không có tiếng */ })
    })
    // trình duyệt tính "đã tương tác" ở lúc nhả tay (touchend/pointerup) hoặc phím — không phải lúc chạm xuống
    const evs = ['pointerup', 'touchend', 'keydown', 'click'] as const
    evs.forEach((e) => window.addEventListener(e, this.unlock, true))
    document.addEventListener('visibilitychange', this.onVisibility)
    return () => {
      evs.forEach((e) => window.removeEventListener(e, this.unlock, true))
      document.removeEventListener('visibilitychange', this.onVisibility)
      this.inited = false
    }
  }

  private unlock = () => {
    if (this.unlocked) return
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    this.unlocked = true
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 1
    this.masterVol.v = this.muted ? 0 : 1
    this.master.connect(this.ctx.destination)
    void this.ctx.resume()
    // phát 1 mẫu im lặng ngay trong cú chạm → iPhone mở khoá hẳn
    const s = this.ctx.createBufferSource()
    s.buffer = this.ctx.createBuffer(1, 1, 22050)
    s.connect(this.ctx.destination)
    s.start(0)
    this.decodeIfReady()
    this.emit()
  }

  private decodeIfReady() {
    const ctx = this.ctx
    if (!ctx) return
    ;(Object.keys(SRC) as Track[]).forEach((t) => {
      const v = this.voices[t]
      if (!v.bytes || v.buffer) return
      const bytes = v.bytes
      v.bytes = null
      ctx.decodeAudioData(bytes).then(
        (b) => { v.buffer = b; this.apply() },
        () => { /* file hỏng: bỏ qua */ },
      )
    })
  }

  private onVisibility = () => {
    const ctx = this.ctx
    if (!ctx) return
    // khoá máy / chuyển tab: dừng hẳn tiếng, quay lại thì chạy tiếp
    if (document.hidden) void ctx.suspend()
    else if (this.unlocked) void ctx.resume()
  }

  /** đổi bài đang cần phát (null = im). `fade` = số giây nhỏ dần/to dần. */
  setScene(track: Track | null, fade = 0.8) {
    this.want = track
    this.fade = fade
    this.apply()
  }

  private apply() {
    if (!this.ctx || !this.master) return
    ;(Object.keys(SRC) as Track[]).forEach((t) => {
      const v = this.voices[t]
      if (this.want === t) this.start(t, v)
      else this.stop(v)
    })
  }

  private start(t: Track, v: Voice) {
    const ctx = this.ctx!
    if (!v.buffer) return // chưa giải mã xong — decodeIfReady sẽ gọi apply lại
    if (!v.source) {
      const src = ctx.createBufferSource()
      src.buffer = v.buffer
      src.loop = true
      const g = ctx.createGain()
      g.gain.value = 0
      v.vol.v = 0
      src.connect(g)
      g.connect(this.master!)
      src.start(0)
      v.source = src
      v.gain = g
    }
    v.tween?.kill()
    v.tween = gsap.to(v.vol, {
      v: LEVEL[t], duration: this.fade, ease: 'sine.inOut',
      onUpdate: () => { if (v.gain) v.gain.gain.value = v.vol.v },
    })
  }

  private stop(v: Voice) {
    if (!v.source) return
    v.tween?.kill()
    v.tween = gsap.to(v.vol, {
      v: 0, duration: this.fade, ease: 'sine.inOut',
      onUpdate: () => { if (v.gain) v.gain.gain.value = v.vol.v },
      onComplete: () => {
        try { v.source?.stop() } catch { /* đã dừng */ }
        v.source?.disconnect()
        v.gain?.disconnect()
        v.source = null
        v.gain = null
      },
    })
  }

  toggleMute() {
    this.muted = !this.muted
    try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0') } catch { /* bỏ qua */ }
    if (this.master) {
      this.masterTween?.kill()
      this.masterTween = gsap.to(this.masterVol, {
        v: this.muted ? 0 : 1, duration: 0.35, ease: 'power2.out',
        onUpdate: () => { if (this.master) this.master.gain.value = this.masterVol.v },
      })
    }
    this.emit()
  }

  /** ?qa: cho kiểm thử tự động biết đang phát bài nào, to cỡ nào */
  status() {
    const v = this.voices
    return {
      unlocked: this.unlocked, ctx: this.ctx?.state ?? null, want: this.want, muted: this.muted,
      ring: { decoded: !!v.ring.buffer, playing: !!v.ring.source, vol: +v.ring.vol.v.toFixed(2) },
      music: { decoded: !!v.music.buffer, playing: !!v.music.source, vol: +v.music.vol.v.toFixed(2) },
    }
  }

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  getMuted = () => this.muted
  private emit() { this.listeners.forEach((f) => f()) }
}

export const audio = new AudioManager()
