import { useNavigate } from "react-router-dom"
import { useState } from "react"
import "./style/NotificationPage.css"

export default function Notification() {
  const navigate = useNavigate()
  const [notifications] = useState([
    { id: 1, text: "Default1", time: "12:00 น." },
    { id: 2, text: "Default2", time: "11:00 น." },
  ])

  return (
    <div className="notification-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        ←
      </button>
      <div className="notification-card">
        <h1>การแจ้งเตือน</h1>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="empty-state">ไม่มีข้อความ</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="notification-item">
                <div className="notification-dot" />
                <div className="notification-text">
                  <span>{n.text}</span>
                  <span className="notification-time">{n.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
