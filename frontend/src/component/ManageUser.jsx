import { useNavigate } from "react-router-dom"
import { useState } from "react"
import "./style/ManageUser.css"

export default function ManageUser() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [owner, setOwner] = useState({
    name: "เจ้าของร้าน: XXXX",
    availability: "ทำงาน",
    chair: "เก้าอี้ 1"
  })

  const [staff, setStaff] = useState([
    { id: 1, name: "XXX1", availability: "ทำงาน", chair: "เก้าอี้ 1" },
    { id: 2, name: "XXX2", availability: "ทำงาน", chair: "เก้าอี้ 2" },
    { id: 3, name: "XXX3", availability: "ทำงาน", chair: "เก้าอี้ 3" }
  ])

  const chairOptions = ["เก้าอี้ 1", "เก้าอี้ 2", "เก้าอี้ 3", "เก้าอี้ 4"]

  const toggleOwnerAvailability = () => {
    setOwner((prev) => ({
      ...prev,
      availability: prev.availability === "ทำงาน" ? "ปิดงาน" : "ทำงาน"
    }))
  }

  const updateOwnerChair = (newChair) => {
    setOwner((prev) => ({
      ...prev,
      chair: newChair
    }))
  }

  const toggleStaffAvailability = (id) => {
    setStaff((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              availability: item.availability === "ทำงาน" ? "ปิดงาน" : "ทำงาน"
            }
          : item
      )
    )
  }

  const updateChair = (id, newChair) => {
    setStaff((prev) =>
      prev.map((item) => (item.id === id ? { ...item, chair: newChair } : item))
    )
  }

  const deleteStaff = (id) => {
    setStaff((prev) => prev.filter((item) => item.id !== id))
  }

  const filteredStaff = staff.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="manage-user-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        ←
      </button>

      <div className="manage-user-card">
        <h1>จัดการบัญชีพนักงาน</h1>

        <div className="search-container">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder=""
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="content-panel">
          <div className="owner-section">
            <div className="staff-info">
              <span
                className={`status-indicator ${
                  owner.availability === "ทำงาน" ? "green" : "red"
                }`}
                onClick={toggleOwnerAvailability}
                style={{ cursor: "pointer" }}
              />
              <span>{owner.name}</span>
            </div>
            <div className="staff-actions">
              <select
                value={owner.chair}
                onChange={(e) => updateOwnerChair(e.target.value)}
                className="status-select"
              >
                {chairOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2>พนักงาน</h2>

          <div className="staff-list">
            {filteredStaff.map((item) => (
              <div key={item.id} className="staff-row">
                <div className="staff-info">
                  <span
                    className={`status-indicator ${
                      item.availability === "ทำงาน"
                        ? "green"
                        : "red"
                    }`}
                    onClick={() => toggleStaffAvailability(item.id)}
                    style={{ cursor: "pointer" }}
                  />
                  <span className="staff-name">{item.name}</span>
                </div>
                <div className="staff-actions">
                  <select
                    value={item.chair}
                    onChange={(e) => updateChair(item.id, e.target.value)}
                    className="status-select"
                  >
                    {chairOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <button className="delete-btn" onClick={() => deleteStaff(item.id)}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
