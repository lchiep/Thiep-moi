import { IconAlarm, IconMessage } from './icons'
import { COPY } from '../../config/copy'

/** Hai nút phụ "Remind Me" / "Message" — chỉ để trang trí, không bấm. */
export default function CallActions() {
  return (
    <div className="call-actions" aria-hidden>
      <div className="call-action">
        <span className="call-action__btn" data-float="remind">
          <IconAlarm />
        </span>
        <span className="call-action__label">{COPY.call.remind}</span>
      </div>
      <div className="call-action">
        <span className="call-action__btn" data-float="message">
          <IconMessage />
        </span>
        <span className="call-action__label">{COPY.call.message}</span>
      </div>
    </div>
  )
}
