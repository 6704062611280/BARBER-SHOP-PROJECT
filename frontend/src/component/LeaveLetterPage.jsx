import { useNavigate } from "react-router-dom"
import { useState } from "react"
import "./style/LeaveLetterPage.css"

export default function LeaveLetter() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    date: "",
    reason: ""
  })

  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (form.date && form.reason) {
      setShowConfirm(true)
    }
  }

  const handleConfirm = () => {
    setShowConfirm(false)
    setShowSuccess(true)
  }

  const closeSuccess = () => {
    setShowSuccess(false)
    setForm({ date: "", reason: "" })
  }

  return (
    <div className="leave-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        ←
      </button>

      <div className="leave-card">
        <h1>แจ้งลา</h1>

        <div className="form-group">
          <label>วันที่</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>สาเหตุ</label>
          <textarea
            value={form.reason}
            onChange={(e) => handleChange("reason", e.target.value)}
            placeholder=" "
          />
        </div>

        <button className="submit-button" onClick={handleSubmit}>
          ยืนยัน
        </button>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>คุณต้องการยืนยันการแจ้งลาหรือไม่?</h3>
            <div className="confirm-info">
              <p><strong>วันที่:</strong> {form.date}</p>
              <p><strong>สาเหตุ:</strong> {form.reason}</p>
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>
                ยกเลิก
              </button>
              <button className="confirm-btn" onClick={handleConfirm}>
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="modal-overlay" onClick={closeSuccess}>
          <div className="modal success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">✓</div>
            <h3>เสร็จสิ้น</h3>
            <button className="done-btn" onClick={closeSuccess}>
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
