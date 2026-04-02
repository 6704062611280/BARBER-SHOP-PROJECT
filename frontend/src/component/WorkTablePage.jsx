import { useNavigate } from "react-router-dom"
import { useState, useContext, useEffect, useCallback, useMemo } from "react"
import { DataContext } from "../DataContext"
import "./style/WorkingTablePage.css"

const STATUS_META = {
  AVAILABLE: { label: "ว่าง",        color: "#6DBF8C", bg: "rgba(109,191,140,.14)", dot: "#6DBF8C" },
  BOOKED:    { label: "จองแล้ว",     color: "#5B9BD5", bg: "rgba(91,155,213,.13)",  dot: "#5B9BD5" },
  CHECKIN:   { label: "กำลังบริการ", color: "#E8B84B", bg: "rgba(232,184,75,.14)",  dot: "#E8B84B" },
  COMPLETE:  { label: "เสร็จสิ้น",   color: "#A78BFA", bg: "rgba(167,139,250,.12)", dot: "#A78BFA" },
  CANCELLED: { label: "ยกเลิก",      color: "#E07B54", bg: "rgba(224,123,84,.12)",  dot: "#E07B54" },
  NO_SHOW:   { label: "ไม่มา",       color: "#aaa",    bg: "rgba(170,170,170,.1)",  dot: "#aaa" },
  EXPIRED:   { label: "เลยเวลา",     color: "#999",    bg: "#f0f0f0",               dot: "#ccc" },
}

function fmtTime(t) { return t ? t.substring(0, 5) : "--:--" }
function fmtDate(d) {
  if (!d) return ""
  return new Date(d + "T00:00:00").toLocaleDateString("th-TH", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  })
}

// เช็คว่าเวลาคิวผ่านมาหรือยัง
const checkIsPast = (startTime) => {
  if (!startTime) return false;
  const [h, m] = startTime.split(':').map(Number);
  const now = new Date();
  const qTime = new Date();
  qTime.setHours(h, m, 0, 0);
  return now > qTime;
};

function ConfirmModal({ data, onClose, onConfirm, loading }) {
  if (!data) return null;
  return (
    <div className="wt-overlay" onClick={() => !loading && onClose()}>
      <div className="wt-modal" onClick={e => e.stopPropagation()}>
        {data.icon && <div className="wt-modal-emoji">{data.icon}</div>}
        <h3 className="wt-modal-title">{data.title}</h3>
        {data.desc && <p className="wt-modal-desc">{data.desc}</p>}
        <div className="wt-modal-btns">
          <button className="wt-btn-ghost" onClick={onClose} disabled={loading}>ยกเลิก</button>
          <button className={`wt-btn-action ${data.danger ? "danger" : ""}`}
            onClick={onConfirm} disabled={loading}>
            {loading && <span className="wt-spin"/>}
            {data.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WorkTablePage() {
  const navigate = useNavigate()
  const { baseURL } = useContext(DataContext)

  const [queues,     setQueues]    = useState([])
  const [chairInfo,  setChairInfo] = useState(null)
  const [userInfo,   setUserInfo]  = useState(null)
  const [loading,    setLoading]   = useState(true)
  const [error,      setError]     = useState("")
  const [actionLoading, setAL]     = useState(false)
  const [modal,      setModal]     = useState(null)
  const [toast,      setToast]     = useState(null)

  const today = useMemo(() => new Date().toISOString().split("T")[0], [])
  const token = localStorage.getItem("token")
  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }), [token])

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2800)
  }

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      // 1. ดึงข้อมูล Profile ของคนเข้าเว็บปัจจุบันก่อน
      const userRes = await fetch(`${baseURL}/auth/profile`, { headers })
      if (!userRes.ok) throw new Error("ยืนยันตัวตนไม่สำเร็จ")
      const userData = await userRes.json()
      setUserInfo(userData)

      // 2. ดึงข้อมูลเก้าอี้ทั้งหมดเพื่อหาตัวที่เป็นของช่างคนนี้
      const chairRes = await fetch(`${baseURL}/queue_service/chairs?dateshop=${today}`, { headers })
      if (!chairRes.ok) throw new Error("โหลดข้อมูลเก้าอี้ไม่สำเร็จ")
      const chairData = await chairRes.json()
      
      // ค้นหาเก้าอี้ที่ barber_name ตรงกับชื่อช่าง (เช็คทั้ง firstname หรือ username)
      const myChair = chairData.chairs.find(c => 
        c.barber_name === userData.firstname || 
        c.barber_name === userData.username
      ) || chairData.chairs[0]; // fallback ตัวแรกถ้าไม่เจอชื่อตรงกัน
      
      setChairInfo(myChair)

      // 3. ดึงคิวของเก้าอี้ตัวนั้น
      const qRes = await fetch(`${baseURL}/queue_service/queues?chair_id=${myChair.id}&dateshop=${today}`, { headers })
      if (!qRes.ok) throw new Error("โหลดข้อมูลคิวไม่สำเร็จ")
      setQueues(await qRes.json())
    } catch (e) { 
      setError(e.message) 
    } finally { 
      setLoading(false) 
    }
  }, [baseURL, today, headers])

  useEffect(() => { if (baseURL) fetchData() }, [fetchData])

  const doAction = async (endpoint) => {
    setAL(true)
    try {
      const res = await fetch(`${baseURL}${endpoint}`, { method: "POST", headers })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || "เกิดข้อผิดพลาด")
      showToast(d.message || "อัปเดตสถานะสำเร็จ")
      fetchData()
    } catch (e) { showToast(e.message, false) }
    finally { setAL(false); setModal(null) }
  }

  // --- Modal Actions ---
  const openWalkin = (q) => setModal({
    icon: "🚶", title: "ลูกค้า Walk-In", desc: `เริ่มบริการทันที รอบเวลา ${fmtTime(q.start_time)}`,
    confirmLabel: "เช็คอิน",
    onConfirm: () => doAction(`/queue_service/chairs/${chairInfo.id}/queues/${q.id}/checkin`)
  })

  const openCheckin = (q) => setModal({
    icon: "✅", title: "ยืนยันเช็คอิน", desc: `ลูกค้าคิวเวลา ${fmtTime(q.start_time)} มาถึงแล้ว`,
    confirmLabel: "เช็คอิน",
    onConfirm: () => doAction(`/queue_service/chairs/${chairInfo.id}/queues/${q.id}/checkin`)
  })

  const openComplete = (q) => setModal({
    icon: "🎉", title: "เสร็จสิ้นบริการ", desc: "ยืนยันการปิดงานคิวนี้",
    confirmLabel: "เสร็จสิ้น",
    onConfirm: () => doAction(`/queue_service/chairs/${chairInfo.id}/queues/${q.id}/complete`)
  })

  const openCancel = (q) => setModal({
    icon: "❌", title: "ยกเลิกคิว", desc: `ยกเลิกคิวเวลา ${fmtTime(q.start_time)}`,
    confirmLabel: "ยืนยันยกเลิก", danger: true,
    onConfirm: () => doAction(`/queue_service/chairs/${chairInfo.id}/queues/${q.id}/cancel`)
  })

  return (
    <div className="wt-page">
      {toast && <div className={`wt-toast ${toast.ok ? "ok" : "fail"}`}>{toast.msg}</div>}

      {/* Header */}
      <div className="wt-header">
        <button className="wt-back" onClick={() => navigate(-1)}>←</button>
        <div className="wt-header-info">
          <h1 className="wt-title">ตารางงานของฉัน</h1>
          <span className="wt-date">{fmtDate(today)}</span>
        </div>
        <button className="wt-refresh-btn" onClick={fetchData}>🔄</button>
      </div>

      {/* Chair Bar: แสดงชื่อช่างที่ล็อกอินและชื่อเก้าอี้ */}
      {chairInfo && (
        <div className="wt-chair-bar">
          <div className="wt-chip">🪑 {chairInfo.name}</div>
          <div className="wt-chip">👤 ช่าง{userInfo?.firstname || userInfo?.username}</div>
          <div className={`wt-shop-status ${chairInfo.status === "ready" ? "open" : "closed"}`}>
            ● {chairInfo.status === "ready" ? "พร้อมทำงาน" : "ปิดเก้าอี้"}
          </div>
        </div>
      )}

      <div className="wt-body">
        {loading && <div className="wt-loading">กำลังโหลด...</div>}
        {!loading && error && <div className="wt-error">{error}</div>}

        {queues.map((q, idx) => {
          const isPast = checkIsPast(q.start_time);
          const isExpired = q.status === "AVAILABLE" && isPast;
          const meta = isExpired ? STATUS_META.EXPIRED : (STATUS_META[q.status] || STATUS_META.AVAILABLE);
          
          const isAvail   = q.status === "AVAILABLE" && !isPast;
          const isBooked  = q.status === "BOOKED";
          const isCheckin = q.status === "CHECKIN";
          const isDone    = ["COMPLETE","CANCELLED","NO_SHOW"].includes(q.status) || isExpired;

          return (
            <div key={q.id} className={`wt-row ${isDone ? "done" : ""} ${isExpired ? "expired" : ""}`}>
              <div className="wt-time-col">
                <span className="wt-time-main">{fmtTime(q.start_time)}</span>
                <span className="wt-time-sep">|</span>
                <span className="wt-time-end">{fmtTime(q.end_time)}</span>
              </div>

              <div className="wt-dot" style={{ background: meta.dot }}/>

              <div className="wt-content">
                <div className="wt-top-line">
                  <span className="wt-status-chip" style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                  {q.status_user && <span className="wt-type">{q.status_user === "ONLINE" ? "📱 App" : "🚶 Walk-In"}</span>}
                </div>

                {(isBooked || isCheckin) && (
                  <div className="wt-cust">ลูกค้าคิว #{q.id.toString().slice(-3)}</div>
                )}

                <div className="wt-actions">
                  {isAvail && <button className="wt-act walkin" onClick={() => openWalkin(q)}>+ Walk-In</button>}
                  {isBooked && (
                    <>
                      <button className="wt-act checkin" onClick={() => openCheckin(q)}>เช็คอิน</button>
                      <button className="wt-act cancel-sm" onClick={() => openCancel(q)}>ยกเลิก</button>
                    </>
                  )}
                  {isCheckin && <button className="wt-act complete" onClick={() => openComplete(q)}>เสร็จสิ้น ✓</button>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmModal data={modal} loading={actionLoading}
        onClose={() => !actionLoading && setModal(null)}
        onConfirm={modal?.onConfirm} />
    </div>
  )
}