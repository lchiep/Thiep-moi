import { forwardRef } from 'react'
import { IconPhone } from '../CallScreen/icons'
import { COPY } from '../../config/copy'
import './SlideToAnswer.css'

/**
 * Thanh "slide to answer" kiểu liquid glass.
 * Bước 1 (Phase 3): chỉ phần nhìn + gợi ý chuyển động.
 * Phase 4 sẽ gắn GSAP Draggable vào `.sta__knob` (GSAP là chủ duy nhất của transform knob).
 */
const SlideToAnswer = forwardRef<HTMLDivElement>(function SlideToAnswer(_, ref) {
  return (
    <div className="sta" ref={ref} role="group" aria-label="Vuốt sang phải để nghe máy">
      <div className="sta__track">
        <span className="sta__sheen" aria-hidden />
        <span className="sta__label">{COPY.call.slide}</span>
      </div>
      <div className="sta__knob" data-knob>
        <span className="sta__phone" data-ring>
          <IconPhone />
        </span>
      </div>
    </div>
  )
})

export default SlideToAnswer
