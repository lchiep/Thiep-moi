import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './app/App'
import { gsap } from 'gsap'
import { useExperience } from './state/experienceMachine'

// ?qa: kiểm thử tự động (Playwright — xem tests/). Chỉ bật khi URL có ?qa.
//  - thời gian GSAP bám đồng hồ thật (không giãn khi rớt khung, máy chậm vẫn đúng nhịp)
//  - trạng thái hiện tại ghi ra <html data-exp="..."> để test chờ đúng cảnh
//  - window.__send(event) để test gửi sự kiện thẳng vào state machine
if (new URLSearchParams(location.search).has('qa')) {
  gsap.ticker.lagSmoothing(0)
  const mark = (s: string) => { document.documentElement.dataset.exp = s }
  mark(useExperience.getState().state)
  useExperience.subscribe((m) => mark(m.state))
  ;(window as unknown as { __send: unknown }).__send = useExperience.getState().send
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
