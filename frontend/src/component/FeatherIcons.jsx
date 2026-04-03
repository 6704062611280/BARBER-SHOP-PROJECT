const defaultProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
}

function IconBase({ size = 24, children, ...props }) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props}>
      {children}
    </svg>
  )
}

export function FiArrowLeft(props) {
  return <IconBase {...props}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></IconBase>
}

export function FiUser(props) {
  return <IconBase {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></IconBase>
}

export function FiCalendar(props) {
  return <IconBase {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></IconBase>
}

export function FiClock(props) {
  return <IconBase {...props}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></IconBase>
}

export function FiLock(props) {
  return <IconBase {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></IconBase>
}

export function FiCheck(props) {
  return <IconBase {...props}><path d="M20 6 9 17l-5-5" /></IconBase>
}

export function FiChevronLeft(props) {
  return <IconBase {...props}><path d="m15 18-6-6 6-6" /></IconBase>
}

export function FiZap(props) {
  return <IconBase {...props}><path d="M13 2 3 14h7l-1 8 10-12h-7z" /></IconBase>
}

export function FiAlertCircle(props) {
  return <IconBase {...props}><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></IconBase>
}

export function FiTrash2(props) {
  return <IconBase {...props}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></IconBase>
}

export function FiMapPin(props) {
  return <IconBase {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></IconBase>
}