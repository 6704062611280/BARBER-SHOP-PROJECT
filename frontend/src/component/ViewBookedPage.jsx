import { useNavigate } from "react-router-dom"
import { useState, useContext } from "react"
import { DataContext } from "../DataContext"
import "./style/ViewBookedPage.css"

export default function BookedPage(){
    const navigate = useNavigate();
    const { bookedQueues, setBookedQueues } = useContext(DataContext);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedCancelItem, setSelectedCancelItem] = useState(null);

    const handleCancelClick = (item) => {
        setSelectedCancelItem(item);
        setShowCancelModal(true);
    };

    const confirmCancel = () => {
        setBookedQueues(bookedQueues.filter(q => q.id !== selectedCancelItem.id));
        setShowCancelModal(false);
        setSelectedCancelItem(null);
    };

    return (
        <div className="view-booked-page">
            <div className="top-actions">
                <button className="back-arrow-btn" onClick={() => navigate(-1)}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <div className="booked-content">
                {bookedQueues.length === 0 ? (
                    <div className="empty-state-box">
                        <h2 className="box-title">การแจ้งเตือน</h2>
                        <div className="empty-message">
                            ไม่มีข้อความ
                        </div>
                    </div>
                ) : (
                    <div className="filled-state-box">
                        <h2 className="box-title">สถานะคิว</h2>
                        <div className="booked-list">
                            {bookedQueues.map((item, index) => (
                                <div key={item.id || index} className="booked-card">
                                    <div className="booked-info">
                                        <span className="queue-number">หมายเลขคิว : {item.code}</span>
                                        <span className="queue-time">ช่วงเวลาที่จอง {item.time}</span>
                                    </div>
                                    <button className="btn-cancel-queue" onClick={() => handleCancelClick(item)}>
                                        ยกเลิก
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            {showCancelModal && selectedCancelItem && (
                <div className="modal-overlay">
                    <div className="cancel-modal">
                        <button className="close-btn" onClick={() => setShowCancelModal(false)}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                            </svg>
                        </button>
                        <h3 className="modal-title">คุณต้องการยกเลิกคิวหรือไม่?</h3>
                        <div className="modal-details">
                            <p>วันที่: {selectedCancelItem.date || "XX XX XXXX"}</p>
                            <p>เวลา: {selectedCancelItem.time}</p>
                        </div>
                        <div className="modal-actions-center">
                            <button className="btn-confirm-cancel" onClick={confirmCancel}>ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}