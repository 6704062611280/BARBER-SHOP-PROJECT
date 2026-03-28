import { useNavigate, useParams } from "react-router-dom"
import { useState, useContext  } from "react"
import { DataContext } from "../DataContext"
import "./style/WorkingTablePage.css"

export default function WorkTablePage(){
    const navigate = useNavigate();
    const { chairId } = useParams();

    const initialSlots = [
        { id: 1, time: "10.00-11.00", status: "booked", customerName: "นายสมชาย มั่นคง", code: "XXXX", phone: "030-404-5050" },
        { id: 2, time: "11.00-12.00", status: "booked", customerName: "กิตติพงศ์ ศรีสุวรรณ", code: "XXXX", phone: "081-472-5936" },
        { id: 3, time: "12.00-13.00", status: "free" },
        { id: 4, time: "13.00-14.00", status: "booked", customerName: "ธนภัทร วงศ์สวัสดิ์", code: "XXXX", phone: "093-615-2847" },
        { id: 5, time: "14.00-15.00", status: "booked", customerName: "ภูวดล จันทร์กระจ่าง", code: "XXXX", phone: "086-739-1045" },
        { id: 6, time: "16.00-17.00", status: "free" },
        { id: 7, time: "17.00-18.00", status: "booked", customerName: "นราธิป ชัยมงคล", code: "XXXX", phone: "095-482-7613" },
        { id: 8, time: "18.00-19.00", status: "booked", customerName: "ปฏิภาณ รัตนชัย", code: "XXXX", phone: "089-653-2971" },
        { id: 9, time: "19.00-20.00", status: "booked", customerName: "ศุภวิชญ์ วัฒนกุล", code: "XXXX", phone: "094-718-3506" }
    ];

    const [slots, setSlots] = useState(initialSlots);

    // Modal States
    const [bookingConfirmModal, setBookingConfirmModal] = useState({ isOpen: false, slot: null });
    const [bookingSuccessModal, setBookingSuccessModal] = useState({ isOpen: false, code: "" });
    const [cancelModal, setCancelModal] = useState({ isOpen: false, slot: null });

    // Actions
    const handleBookClick = (slot) => {
        setBookingConfirmModal({ isOpen: true, slot: slot });
    };

    const confirmBooking = () => {
        const slot = bookingConfirmModal.slot;
        setSlots(slots.map(s => s.id === slot.id ? { ...s, status: "walkin" } : s));
        setBookingConfirmModal({ isOpen: false, slot: null });
        setBookingSuccessModal({ isOpen: true, code: "XXXX" });
    };

    const handleCancelClick = (slot) => {
        setCancelModal({ isOpen: true, slot: slot });
    };

    const confirmCancel = () => {
        const slot = cancelModal.slot;
        setSlots(slots.map(s => s.id === slot.id ? { ...s, status: "free", customerName: null, code: null, phone: null } : s));
        setCancelModal({ isOpen: false, slot: null });
    };

    return (
        <div className="working-table-page">
            <div className="top-actions">
                <button className="back-arrow-btn" onClick={() => navigate(-1)}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <div className="header-info-container">
                <button className="today-btn">วันนี้</button>
                <div className="chair-barber-box">
                    <p>เก้าอี้ 1</p>
                    <p>ช่าง : XXX</p>
                </div>
            </div>

            <div className="table-container">
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th className="th-time">เวลา</th>
                            <th className="th-status">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slots.map((slot) => {
                            const isFree = slot.status === "free";
                            const isWalkin = slot.status === "walkin";
                            const isBooked = slot.status === "booked";

                            return (
                                <tr key={slot.id} className={isFree ? "row-free" : "row-booked"}>
                                    <td className="time-cell">{slot.time} น.</td>
                                    <td className="status-cell-td">
                                        <div className={`status-cell ${isFree || isWalkin ? 'center-content' : ''}`}>
                                            {isFree && (
                                                <button className="btn-book" onClick={() => handleBookClick(slot)}>จองคิว</button>
                                            )}
                                            
                                            {isWalkin && (
                                                <div className="walk-in-text">ลูกค้า Walk-In</div>
                                            )}

                                            {isBooked && (
                                                <>
                                                    <div className="customer-info">
                                                        <p>ลูกค้า:{slot.customerName}</p>
                                                        <p>รหัส: {slot.code}</p>
                                                        <p>เบอร์โทร: {slot.phone}</p>
                                                    </div>
                                                    <button className="btn-cancel" onClick={() => handleCancelClick(slot)}>ยกเลิก</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Booking Confirm Modal */}
            {bookingConfirmModal.isOpen && bookingConfirmModal.slot && (
                <div className="modal-overlay">
                    <div className="custom-modal">
                        <h3 className="modal-title">คุณต้องการยืนยันการจองคิวหรือไม่?</h3>
                        <div className="modal-details">
                            <p>วันที่: XX XX XXXX</p>
                            <p>เวลา:{bookingConfirmModal.slot.time.replace('.', '.').replace('-', ' -')}</p>
                        </div>
                        <div className="modal-actions-center">
                            <button className="btn-confirm-cancel" onClick={() => setBookingConfirmModal({ isOpen: false, slot: null })}>ยกเลิก</button>
                            <button className="btn-confirm-ok" onClick={confirmBooking}>ยืนยัน</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Success Modal */}
            {bookingSuccessModal.isOpen && (
                <div className="modal-overlay">
                    <div className="custom-modal" style={{ textAlign: "center" }}>
                        <h3 className="modal-title" style={{ marginTop: 0 }}>การจองสำหรับลูกค้า Walk-In เสร็จสิ้น</h3>
                        
                        <div className="success-icon-container">
                            <div className="success-icon">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="modal-details" style={{ marginBottom: "40px" }}>
                            รหัสยืนยัน: {bookingSuccessModal.code}
                        </div>
                        
                        <button className="btn-done" onClick={() => setBookingSuccessModal({ isOpen: false, code: "" })}>เสร็จสิ้น</button>
                    </div>
                </div>
            )}

            {/* Cancel Confirm Modal */}
            {cancelModal.isOpen && cancelModal.slot && (
                <div className="modal-overlay">
                    <div className="custom-modal">
                        <button className="close-btn" onClick={() => setCancelModal({ isOpen: false, slot: null })}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <h3 className="modal-title">คุณต้องการยกเลิกคิวหรือไม่?</h3>
                        <div className="modal-details">
                            <p>วันที่: XX XX XXXX</p>
                            <p>เวลา:{cancelModal.slot.time.replace('.', '.').replace('-', ' -')}</p>
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