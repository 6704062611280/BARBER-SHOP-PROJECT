import { useNavigate, useLocation } from "react-router-dom"
import "./style/LeaveDetailPage.css"

export default function LeaveDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const leaveRequest = location.state?.leaveRequest

  if (!leaveRequest) {
    return (
      <div className="leave-detail-page">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <div className="leave-detail-card">
          <h1>ไม่พบข้อมูล</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="leave-detail-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        ←
      </button>

      <div className="leave-detail-card">
        <h1>รายละเอียดการลา</h1>

        <div className="detail-section">
          <div className="detail-item">
            <label>ชื่อ Barber</label>
            <p className="detail-value">{leaveRequest.name}</p>
          </div>

          <div className="detail-item">
            <label>วันที่ลา</label>
            <p className="detail-value">{leaveRequest.date}</p>
          </div>

          <div className="detail-item">
            <label>สถานะ</label>
            <p className={`detail-value status ${leaveRequest.status.replace(/\s+/g, "-").toLowerCase()}`}>
              {leaveRequest.status}
            </p>
          </div>

          <div className="detail-item">
            <label>เหตุผล</label>
            <p className="detail-value reason">เหตุผลในการลาประจำวัน</p>
          </div>
        </div>

        {leaveRequest.status === "รอคำตัดสิน" && (
          <div className="action-buttons">
            <button className="approve-btn">อนุมัติ</button>
            <button className="reject-btn">ปฏิเสธ</button>
          </div>
        )}
      </div>
    </div>
  )
}
