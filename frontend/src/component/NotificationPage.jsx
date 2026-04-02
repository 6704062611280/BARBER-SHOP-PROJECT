import { useNavigate } from "react-router-dom"
import { useState } from "react"
import "./style/NotificationPage.css"



const TYPE_META = {
  QUEUE_BOOKED:    { label: "จองคิวสำเร็จ",         color: "#5B9BD5" },
  QUEUE_CANCELLED: { label: "คิวถูกยกเลิก",          color: "#E07B54" },
  QUEUE_REMINDER:  { label: "แจ้งเตือนก่อนถึงคิว",   color: "#E8B84B" },
  LEAVE_APPROVED:  { label: "คำขอลาอนุมัติแล้ว",     color: "#6DBF8C" },
  LEAVE_REJECTED:  { label: "คำขอลาถูกปฏิเสธ",       color: "#E07B54" },
  SYSTEM:          { label: "ระบบ",                   color: "#A78BFA" },
}

function formatTime(dateStr) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleString("th-TH", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  })
}

export default function NotificationPage() {
  const navigate = useNavigate()
  const { baseURL } = useContext(DataContext)

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const token = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true); setError("")
      try {
        const res = await fetch(`${baseURL}/data_service/notifications`, { headers })
        if (!res.ok) throw new Error("โหลดการแจ้งเตือนไม่สำเร็จ")
        setNotifications(await res.json())
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (baseURL) fetch_()
  }, [baseURL])

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    try {
      await fetch(`${baseURL}/data_service/notifications/${id}/read`, {
        method: "PATCH", headers
      })
    } catch {}
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      await fetch(`${baseURL}/data_service/notifications/read_all`, {
        method: "PATCH", headers
      })
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <>
      <style>{styles}</style>
      <div className="np-page">
        <div className="np-inner">
          <button className="np-back" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            ย้อนกลับ
          </button>

          <div className="np-card">
            {/* Header */}
            <div className="np-header">
              <div className="np-title-wrap">
                <div className="np-title">การแจ้งเตือน</div>
                {unreadCount > 0 && <div className="np-badge">{unreadCount} ใหม่</div>}
              </div>
              {unreadCount > 0 && (
                <button className="np-mark-all" onClick={markAllRead}>อ่านทั้งหมด</button>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="np-loading">
                <div className="np-spinner" />
                <span>กำลังโหลด...</span>
              </div>
            )}

            {/* Error */}
            {!loading && error && <div className="np-error">⚠️ {error}</div>}

            {/* Skeleton rows */}
            {loading && (
              <div style={{ padding: '0.5rem 1.75rem 1.5rem' }}>
                {[1, 2, 3].map(k => (
                  <div key={k} style={{ display: 'flex', gap: 12, padding: '1rem 0', borderBottom: '1px solid rgba(201,152,58,.08)' }}>
                    <div className="skel" style={{ width: 4, borderRadius: 4, alignSelf: 'stretch' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skel" style={{ height: 13, width: '35%', marginBottom: 8 }} />
                      <div className="skel" style={{ height: 15, width: '70%', marginBottom: 6 }} />
                      <div className="skel" style={{ height: 13, width: '90%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && !error && notifications.length === 0 && (
              <div className="np-empty">
                <div className="np-empty-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p>ไม่มีการแจ้งเตือนในขณะนี้</p>
              </div>
            )}

            {/* List */}
            {!loading && !error && notifications.length > 0 && (
              <div className="np-list">
                {notifications.map(n => {
                  const meta = TYPE_META[n.type] || { label: n.type, color: "#888" }
                  return (
                    <div
                      key={n.id}
                      className={`np-item ${!n.is_read ? 'unread' : ''}`}
                      onClick={() => !n.is_read && markRead(n.id)}
                    >
                      <div className="np-color-bar" style={{ background: meta.color }} />
                      <div className="np-body">
                        <div className="np-top-row">
                          <span className="np-type-chip"
                            style={{ color: meta.color, background: meta.color + '18' }}>
                            {meta.label}
                          </span>
                          {!n.is_read && <div className="np-new-pip" />}
                        </div>
                        <div className="np-item-title">{n.title}</div>
                        <div className="np-item-msg">{n.message}</div>
                        <span className="np-time">{formatTime(n.create_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}