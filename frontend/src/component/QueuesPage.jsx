import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useContext, useCallback } from "react";
import { DataContext } from "../DataContext";
import "./style/QueuesPage.css";

export default function QueuesPage() {
    const { chairId } = useParams();
    const navigate = useNavigate();
    const { user, baseURL } = useContext(DataContext); 
    
    const [queues, setQueues] = useState([]);
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [bookingRef, setBookingRef] = useState("");
    const [loading, setLoading] = useState(true);

    /**
     * ✅ Logic คำนวณสถานะคิว (Available / No-Show / Booked / Check-in / Complete)
     */
    const getCalculatedStatus = (q) => {
        const now = new Date();
        const [hours, minutes] = q.start_time.split(':');
        const queueStartTime = new Date();
        queueStartTime.setHours(parseInt(hours), parseInt(minutes), 0);
        
        const diffMinutes = (now - queueStartTime) / (1000 * 60);

        if (q.status === "COMPLETE" || q.status === "CHECKIN") return q.status;
        if (diffMinutes > 15 && (q.status === "AVAILABLE" || q.status === "BOOKED")) return "NO_SHOW";

        return q.status;
    };

    const fetchQueues = useCallback(async () => {
        try {
            const res = await fetch(`${baseURL}/queue_service/queues?chair_id=${chairId}`);
            if (res.ok) {
                const data = await res.json();
                setQueues(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [baseURL, chairId]);

    useEffect(() => {
        fetchQueues();
        const interval = setInterval(fetchQueues, 30000);
        return () => clearInterval(interval);
    }, [fetchQueues]);

    /**
     * ✅ ฟังก์ชันจัดการการคลิกจอง (ตรวจสอบสิทธิ์)
     */
    const handleBookingClick = (queue) => {
        // 1. ตรวจสอบว่า Login หรือยัง
        if (!user) {
            alert("กรุณาเข้าสู่ระบบก่อนทำการจองคิว");
            navigate("/login"); // ส่งไปหน้า Login
            return;
        }

        // 2. ตรวจสอบ Role ว่าเป็น CUSTOMER หรือไม่
        if (user.rolestatus !== "CUSTOMER") {
            alert("ขออภัย เฉพาะบัญชีลูกค้าเท่านั้นที่สามารถจองคิวได้");
            return;
        }

        // 3. ถ้าผ่านเงื่อนไข ให้เปิด Modal ยืนยัน
        setSelectedQueue(queue);
        setShowConfirm(true);
    };

    const confirmBooking = async () => {
        try {
            const res = await fetch(`${baseURL}/queue_service/user/${chairId}/queues/${selectedQueue.id}/booked`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (res.ok) {
                const result = await res.json();
                setBookingRef(`Q-${result.id}`); 
                setShowConfirm(false);
                setShowSuccess(true);
            } else {
                const errData = await res.json();
                alert(errData.detail || "การจองล้มเหลว");
                fetchQueues();
            }
        } catch (err) {
            alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
        }
    };

    if (loading) return <div className="q-loading-simple">กำลังโหลด...</div>;

    return (
        <div className="q-modern-layout">
            <div className="q-card-main">
                {/* Header */}
                <div className="q-header-nav">
                    <button className="q-back-btn-minimal" onClick={() => navigate(-1)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <div className="q-title-group">
                        <h2>เลือกเวลาจองคิว</h2>
                        <p>เก้าอี้ {chairId} • {new Date().toLocaleDateString('th-TH', { month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* Slots List */}
                <div className="q-slots-grid">
                    {queues.map((q) => {
                        const currentStatus = getCalculatedStatus(q);
                        const isAvailable = currentStatus === "AVAILABLE";

                        return (
                            <div key={q.id} className={`q-slot-item status-${currentStatus.toLowerCase()}`}>
                                <div className="q-time-info">
                                    <span className="q-time-text">{q.start_time.substring(0, 5)} - {q.end_time.substring(0, 5)}</span>
                                    <span className="q-unit">น.</span>
                                </div>

                                <div className="q-status-action">
                                    {isAvailable ? (
                                        <button className="q-btn-book" onClick={() => handleBookingClick(q)}>
                                            จองคิว
                                        </button>
                                    ) : (
                                        <div className={`q-badge badge-${currentStatus.toLowerCase()}`}>
                                            {currentStatus === "BOOKED" && "จองแล้ว"}
                                            {currentStatus === "NO_SHOW" && "เลยเวลา/ไม่มา"}
                                            {currentStatus === "CHECKIN" && "กำลังรับบริการ"}
                                            {currentStatus === "COMPLETE" && "เสร็จสิ้น"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal ยืนยันการจอง */}
            {showConfirm && (
                <div className="q-overlay">
                    <div className="q-modal">
                        <h3>ยืนยันการจองคิว</h3>
                        <div className="q-modal-detail">
                            <p>รอบเวลา: <strong>{selectedQueue?.start_time.substring(0, 5)} - {selectedQueue?.end_time.substring(0, 5)} น.</strong></p>
                            <span>* โปรดมาถึงก่อนเวลา 5-10 นาที</span>
                        </div>
                        <div className="q-modal-btns">
                            <button className="q-btn-cancel" onClick={() => setShowConfirm(false)}>ยกเลิก</button>
                            <button className="q-btn-confirm" onClick={confirmBooking}>ยืนยันการจอง</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal สำเร็จ */}
            {showSuccess && (
                <div className="q-overlay">
                    <div className="q-modal q-modal-success">
                        <div className="q-success-icon">✓</div>
                        <h3>จองคิวสำเร็จ</h3>
                        <p>รหัสอ้างอิง: <strong>{bookingRef}</strong></p>
                        <button className="q-btn-done" onClick={() => navigate("/booked-table")}>ดูคิวของฉัน</button>
                    </div>
                </div>
            )}
        </div>
    );
}