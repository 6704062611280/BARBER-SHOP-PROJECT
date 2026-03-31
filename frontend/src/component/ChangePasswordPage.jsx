import { useNavigate } from "react-router-dom"
import { useState } from "react"
import "./style/ChangePasswordPage.css"

export default function ChangePasswordPage(){
  const navigate = useNavigate()
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (form.newPassword !== form.confirmPassword) {
      alert("New passwords do not match")
      return
    }
    setShowConfirm(true)
  }

  const handleConfirmChange = () => {
    setShowConfirm(false)
    setShowSuccess(true)
    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
  }

  const closeModals = () => {
    setShowConfirm(false)
    setShowSuccess(false)
  }

  return (
    <div className="change-password-page">
      <button type="button" className="back-button" onClick={() => navigate(-1)}>
        ←
      </button>
      <main className="change-password-card-wrapper">
        <section className="card">
          <h2>เปลี่ยนรหัสผ่าน</h2>
          <div className="avatar-circle">🔒</div>

          <div className="field">
            <label>รหัสผ่านปัจจุบัน</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => handleChange("currentPassword", e.target.value)}
              placeholder="กรอกรหัสผ่านปัจจุบัน"
            />
          </div>

          <div className="field">
            <label>รหัสผ่านใหม่</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่"
            />
          </div>

          <div className="field">
            <label>ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="ยืนยันรหัสผ่านใหม่"
            />
          </div>

          <div className="button-row">
            <button type="button" className="orange-button" onClick={handleSubmit}>
              เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </section>
      </main>

      {showConfirm && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>คุณต้องการเปลี่ยนรหัสผ่านหรือไม่?</h3>
            <div className="modal-buttons">
              <button type="button" className="cancel" onClick={closeModals}>
                ยกเลิก
              </button>
              <button type="button" className="confirm" onClick={handleConfirmChange}>
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>เปลี่ยนรหัสผ่านสำเร็จแล้ว</h3>
            <button className="confirm" onClick={closeModals}>
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
