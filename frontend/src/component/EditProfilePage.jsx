import { useNavigate } from "react-router-dom"
import { useState } from "react"
import "./style/EditProfilePage.css"

export default function EditProfilePage(){
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    email: "",
    currentPassword: ""
  })

  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setShowPasswordConfirm(true)
  }

  const handleConfirmSave = () => {
    setShowPasswordConfirm(false)
    setShowSaveSuccess(true)
    setForm((prev) => ({ ...prev, currentPassword: "" }))
  }

  const handleChangePassword = () => {
    setShowPasswordSuccess(true)
  }

  const closeModals = () => {
    setShowPasswordConfirm(false)
    setShowPasswordSuccess(false)
    setShowSaveSuccess(false)
  }

  return (
    <div className="edit-profile-page">
      <button type="button" className="back-button" onClick={() => navigate(-1)}>
        ←
      </button>
      <main className="edit-profile-card-wrapper">
        <section className="card">
          <h2>แก้ไขข้อมูลส่วนตัว</h2>
          <div className="avatar-circle">👤</div>

          <div className="field-row">
            <div className="field">
              <label>ชื่อ</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="นายสมชาย"
              />
            </div>

            <div className="field">
              <label>นามสกุล</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="บัณฑิต"
              />
            </div>
          </div>

          <div className="field">
            <label>ชื่อบัญชีผู้ใช้</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="Somchai"
            />
          </div>

          <div className="field">
            <label>หมายเลขโทรศัพท์</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="020-123-4567"
            />
          </div>

          <div className="field">
            <label>อีเมล</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Example@gmail.com"
            />
          </div>

          <div className="button-row">
            <button type="button" className="orange-button" onClick={handleChangePassword}>
              แก้ไขรหัสผ่าน
            </button>
            <button type="button" className="orange-button" onClick={handleSave}>
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </section>
      </main>

      {showPasswordConfirm && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>คุณต้องการยืนยันการเปลี่ยนแปลงหรือไม่?</h3>
            <input
              type="password"
              placeholder="กรอกรหัสผ่าน"
              value={form.currentPassword}
              onChange={(e) => handleChange("currentPassword", e.target.value)}
            />
            <div className="modal-buttons">
              <button type="button" className="cancel" onClick={closeModals}>
                ยกเลิก
              </button>
              <button type="button" className="confirm" onClick={handleConfirmSave}>
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordSuccess && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>เปลี่ยนแปลงรหัสผ่านสำเร็จแล้ว</h3>
            <button className="confirm" onClick={closeModals}>
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}

      {showSaveSuccess && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>เปลี่ยนแปลงข้อมูลสำเร็จ</h3>
            <button className="confirm" onClick={closeModals}>
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
