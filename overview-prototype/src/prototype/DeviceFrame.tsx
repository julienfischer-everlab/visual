import type { ReactNode } from 'react'
import './DeviceFrame.css'

/**
 * iPhone frame for the mobile test state. The frame is fixed at the real
 * device size — 402 × 853 — and the app inside it scrolls; nothing is scaled,
 * so the mobile UI renders at its true breakpoint.
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="device-frame">
      <div className="device-frame__screen">
        <div className="device-frame__status">
          <span className="device-frame__time">9:41</span>
          <span className="device-frame__island" />
          <span className="device-frame__indicators">
            <svg viewBox="0 0 18 12" width="17" height="11" aria-hidden="true">
              {[0, 1, 2, 3].map((bar) => (
                <rect
                  key={bar}
                  x={bar * 4.6}
                  y={9 - bar * 2.6}
                  width="3.2"
                  height={3 + bar * 2.6}
                  rx="1"
                  fill="currentColor"
                />
              ))}
            </svg>
            <svg viewBox="0 0 16 12" width="15" height="11" aria-hidden="true">
              <path
                d="M1 4.4a10 10 0 0114 0M3.4 7a6.6 6.6 0 019.2 0M6 9.5a3 3 0 014 0"
                stroke="currentColor"
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <svg viewBox="0 0 26 12" width="24" height="11" aria-hidden="true">
              <rect
                x="0.7"
                y="0.7"
                width="21"
                height="10.6"
                rx="3"
                stroke="currentColor"
                strokeOpacity="0.4"
                strokeWidth="1"
                fill="none"
              />
              <rect x="2.2" y="2.2" width="15" height="7.6" rx="2" fill="currentColor" />
              <path
                d="M23.4 4.2v3.6a2 2 0 000-3.6z"
                fill="currentColor"
                fillOpacity="0.4"
              />
            </svg>
          </span>
        </div>

        <div className="device-frame__content">{children}</div>

        <div className="device-frame__home">
          <span />
        </div>
      </div>
    </div>
  )
}
