import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { DataContext } from "../DataContext";
import "./style/QueuesPage.css";

export default function QueuesPage() {
    const { chairId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(DataContext); 
    
    const [queues, setQueues] = useState([]);
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [bookingRef, setBookingRef] = useState("");

    useEffect(() => {
        // Mock ข้อมูลสำหรับแสดงผลตาราง
        const mockData = [
            { id: 1, start_time: "10:00", end_time: "11:00", status: "BOOKED" },
            { id: 2, start_time: "11:00", end_time: "12:00", status: "BOOKED" },
            { id: 3, start_time: "12:00", end_time: "13:00", status: "AVAILABLE" },
            { id: 4, start_time: "13:00", end_time: "14:00", status: "BOOKED" },
            { id: 5, start_time: "14:00", end_time: "15:00", status: "BOOKED" },
            { id: 6, start_time: "16:00", end_time: "17:00", status: "AVAILABLE" },
            { id: 7, start_time: "17:00", end_time: "18:00", status: "BOOKED" },
            { id: 8, start_time: "18:00", end_time: "19:00", status: "BOOKED" },
            { id: 9, start_time: "19:00", end_time: "20:00", status: "BOOKED" },
        ];
        setQueues(mockData);
    }, [chairId]);

    const handleBookingClick = (queue) => {
        if (user?.rolestatus === "CUSTOMER" && queue.status === "AVAILABLE") {
            setSelectedQueue(queue);
            setShowConfirm(true);
        }
    };

    const confirmBooking = () => {
        // ขั้นตอนนี้ควรจะยิง API ไปที่ Backend ของคุณ
        // เมื่อสำเร็จ ให้เก็บค่า reference และเปลี่ยนไป Popup ถัดไป
        setBookingRef("X4B9"); 
        setShowConfirm(false);
        setShowSuccess(true);
    };

    const handleFinish = () => {
        // เมื่อกด "เสร็จสิ้น" จะนำทางไปยังหน้ารายการที่จอง (ViewBookedPage)
        navigate("/booked-table");
    };

    return (
        <div className="q-page-container">
            <div className="q-nav">
                <button className="q-back-btn" onClick={() => navigate(-1)}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            <div className="q-date-badge">วันนี้</div>

            <div className="q-card">
                <div className="q-table-header">
                    <div className="col-time">เวลา</div>
                    <div className="col-status">สถานะ</div>
                </div>
                
                <div className="q-list">
                    {queues.map((q) => (
                        <div key={q.id} className="q-row">
                            <div className="q-time-text">{q.start_time}-{q.end_time} น.</div>
                            <div className="q-action-area">
                                {q.status === "AVAILABLE" ? (
                                    <button 
                                        className="btn-q-available"
                                        onClick={() => handleBookingClick(q)}
                                    >
                                        จองคิว
                                    </button>
                                ) : (
                                    <div className="label-q-booked">จองแล้ว</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Popup 1: ยืนยันการจองคิว */}
            {showConfirm && (
                <div className="q-modal-overlay">
                    <div className="q-modal-content">
                        <h3 className="modal-title">คุณต้องการยืนยันการจองคิวหรือไม่?</h3>
                        <div className="modal-body">
                            <p>วันที่: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p>เวลา: {selectedQueue?.start_time} - {selectedQueue?.end_time}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowConfirm(false)}>ยกเลิก</button>
                            <button className="btn-modal-confirm" onClick={confirmBooking}>ยืนยัน</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup 2: จองสำเร็จ */}
            {showSuccess && (
                <div className="q-modal-overlay">
                    <div className="q-modal-content success-modal">
                        <h3 className="modal-title">การจองของคุณเสร็จสมบูรณ์</h3>
                        <div className="success-icon-wrapper">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <p className="ref-text">รหัสยืนยัน: {bookingRef}</p>
                        <button className="btn-modal-done" onClick={handleFinish}>เสร็จสิ้น</button>
                    </div>
                </div>
            )}
        </div>
    );
}