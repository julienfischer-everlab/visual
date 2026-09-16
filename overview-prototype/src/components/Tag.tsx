import './Tag.css'

/** The blue "Protocol" category tag used across the Action Plan. */
export function Tag({ label }: { label: string }) {
  return <span className="tag">{label}</span>
}
