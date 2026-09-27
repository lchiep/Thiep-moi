import { useEffect, useRef } from 'react'
import { wallTitleReveal } from '../../animations/anime/textReveal'
import { COPY } from '../../config/copy'
import './WallTitle.css'

/** Dòng chữ như ánh nắng in lên bức tường phía trên (nhánh Nam). */
export default function WallTitle({ nickname, show }: { nickname: string; show: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!show || !root.current) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scope = wallTitleReveal(root.current, reduce)
    return () => scope.revert()
  }, [show])

  return (
    <div className={`wall-title ${show ? 'is-on' : ''}`} ref={root}>
      <p className="wall-title__script" data-wipe>
        {COPY.male.wallTitle}
      </p>
      <p className="wall-title__for" aria-label={`${COPY.male.wallFor} ${nickname}`}>
        <span className="wall-title__lead" data-fade>{COPY.male.wallFor}</span>
        <span className="wall-title__name" aria-hidden>
          {[...nickname].map((ch, i) => (
            <span key={i} data-char>{ch === ' ' ? ' ' : ch}</span>
          ))}
        </span>
      </p>
    </div>
  )
}
