import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './app/App'
import { gsap } from 'gsap'

// ?qa: kiểm thử tự động trên máy chậm — thời gian GSAP bám đồng hồ thật (không giãn khi rớt khung)
if (new URLSearchParams(location.search).has('qa')) gsap.ticker.lagSmoothing(0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
