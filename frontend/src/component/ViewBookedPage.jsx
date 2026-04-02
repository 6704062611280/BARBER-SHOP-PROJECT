import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect, useCallback } from "react";
import { DataContext } from "../DataContext";
import "./style/ViewBookedPage.css";

export default function BookedPage() {
    const navigate = useNavigate();
    const { baseURL, user } = useContext(DataContext);
    const [bookedQueues, setBookedQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedCancelItem, setSelectedCancelItem] = useState(null);

    // ✅ ดึงข้อมูลคิวที่จองไว้ของ User คนนี้จาก Backend
    const fetchMyBookedQueues = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${baseURL}/queue_service/my-bookings`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBookedQueues(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [baseURL]);

    useEffect(() => {
        fetchMyBookedQueues();
    }, [fetchMyBookedQueues]);

    const handleCancelClick = (item) => {
        setSelectedCancelItem(item);
        setShowCancelModal(true);
    };

    // ✅ ฟังก์ชันกดยกเลิกคิว (ส่งไปที่ Backend)
    const confirmCancel = async () => {
        try {
            const res = await fetch(`${baseURL}/queue_service/cancel-booking/${selectedCancelItem.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });

            if (res.ok) {
                // อัปเดต UI โดยดึงข้อมูลใหม่หรือกรองตัวที่ลบออก
                setBookedQueues(bookedQueues.filter(q => q.id !== selectedCancelItem.id));
                setShowCancelModal(false);
                setSelectedCancelItem(null);
            } else {
                alert("ไม่สามารถยกเลิกได้ในขณะนี้");
            }
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    if (loading) return <div className="booked-loading">กำลังโหลดข้อมูลคิว...</div>;

    return (
        <div className="view-booked-page">
            <div className="top-actions">
                <button className="back-arrow-btn" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="page-main-title">การจองของฉัน</h1>
            </div>

            <div className="booked-content">
                {bookedQueues.length === 0 ? (
                    <div className="empty-state-box">
                        <div className="empty-icon">📅</div>
                        <h2 className="box-title">ไม่มีการจองคิว</h2>
                        <p className="empty-message">คุณยังไม่มีคิวที่จองไว้ในขณะนี้</p>
                        <button className="go-book-btn" onClick={() => navigate("/select-chair")}>จองคิวตอนนี้</button>
                    </div>
                ) : (
                    <div className="filled-state-box">
                        <div className="booked-list">
                            {bookedQueues.map((item) => (
                                <div key={item.id} className="booked-card">
                                    <div className="card-header">
                                        <span className="chair-label">เก้าอี้ {item.chair_name || item.chair_id}</span>
                                        <span className={`status-tag ${item.status.toLowerCase()}`}>
                                            {item.status === "BOOKED" ? "จองแล้ว" : "รอดำเนินการ"}
                                        </span>
                                    </div>
                                    
                                    <div className="booked-info">
                                        <div className="info-row">
                                            <span className="label">เวลา:</span>
                                            <span className="value">{item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)} น.</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">ช่างตัดผม:</span>
                                            <span className="value">{item.barber_name || "ไม่ระบุ"}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">วันที่:</span>
                                            <span className="value">{new Date(item.date_working).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    <button className="btn-cancel-queue" onClick={() => handleCancelClick(item)}>
                                        ยกเลิกคิวนี้
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="modal-overlay">
                    <div className="cancel-modal">
                        <h3 className="modal-title">ยืนยันการยกเลิกคิว?</h3>
                        <div className="modal-details">
                            <p>เก้าอี้ {selectedCancelItem.chair_name}</p>
                            <p>เวลา {selectedCancelItem.start_time.substring(0, 5)} น.</p>
                        </div>
                        <div className="modal-actions-center">
                            <button className="btn-no" onClick={() => setShowCancelModal(false)}>ไม่ เปลี่ยนใจ</button>
                            <button className="btn-confirm-cancel" onClick={confirmCancel}>ยืนยัน ยกเลิกคิว</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}