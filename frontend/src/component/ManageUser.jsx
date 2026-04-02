import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./style/ManageUser.css";

const BASE_URL = "http://127.0.0.1:8000/barber_manage";
const getAuthHeader = () => ({
  "Authorization": `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json"
});

export default function ManageUser() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("staff");
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resCust, resStaff, resLeave] = await Promise.all([
        fetch(`${BASE_URL}/customer`, { headers: getAuthHeader() }),
        fetch(`${BASE_URL}/barber_view`, { headers: getAuthHeader() }),
        fetch(`${BASE_URL}/leave_letter`, { headers: getAuthHeader() })
      ]);
      
      const customers = await resCust.json();
      const barbers = await resStaff.json();
      const leaves = await resLeave.json();

      setUsers(Array.isArray(customers) ? customers : []);
      setStaff(Array.isArray(barbers) ? barbers : []);
      setLeaveRequests(Array.isArray(leaves) ? leaves : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="manage-user-container">
      <div className="manage-user-card-central">
        <h1 className="main-title">จัดการร้าน</h1>

        {/* Tab Navigation */}
        <div className="custom-tabs">
          <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>ลูกค้า</button>
          <button className={activeTab === "staff" ? "active" : ""} onClick={() => setActiveTab("staff")}>พนักงาน</button>
          <button className={activeTab === "leave" ? "active" : ""} onClick={() => setActiveTab("leave")}>จดหมายลา</button>
        </div>

        <div className="table-section">
          {/* --- Tab: ลูกค้า --- */}
          {activeTab === "all" && (
            <table className="manage-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((u, index) => (
                  <tr key={u.id}>
                    <td>{index + 1}</td>
                    <td>{u.firstname} {u.lastname}</td>
                    <td><button className="btn-add" onClick={() => {/* addAsEmployee(u.id) */}}>ตั้งพนักงาน</button></td>
                  </tr>
                )) : <tr><td colSpan="3" className="no-data">ไม่พบข้อมูลลูกค้า</td></tr>}
              </tbody>
            </table>
          )}

          {/* --- Tab: พนักงาน --- */}
          {activeTab === "staff" && (
            <table className="manage-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>เก้าอี้</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {staff.length > 0 ? staff.map((s, index) => (
                  <tr key={s.id}>
                    <td>{index + 1}</td>
                    <td>{s.user_data?.firstname} {s.user_data?.lastname}</td>
                    <td>
                      <select className="table-select">
                        <option>เลือกเก้าอี้</option>
                        <option>เก้าอี้ 1</option>
                      </select>
                    </td>
                    <td>
                      {/* ถ้าเป็น Owner (สมมติเช็คจาก Role) จะไม่โชว์ปุ่มลบ */}
                      {s.user_data?.rolestatus !== "OWNER" && (
                        <button className="btn-revoke" onClick={() => {/* revoke(s.id) */}}>ถอนออก</button>
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan="4" className="no-data">ไม่พบข้อมูลพนักงาน</td></tr>}
              </tbody>
            </table>
          )}

          {/* --- Tab: จดหมายลา --- */}
          {activeTab === "leave" && (
            <table className="manage-table">
              <thead>
                <tr>
                  <th>ชื่อ Barber</th>
                  <th>วันที่ลา</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length > 0 ? leaveRequests.map((l) => (
                  <tr key={l.id}>
                    <td>{l.barber?.user_data?.firstname}</td>
                    <td>{l.date_leave}</td>
                    <td>
                      <button className="btn-view" onClick={() => navigate(`/leave-detail/${l.id}`)}>
                        ดูเพิ่มเติม
                      </button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="3" className="no-data">ไม่มีคำขอลาในขณะนี้</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}