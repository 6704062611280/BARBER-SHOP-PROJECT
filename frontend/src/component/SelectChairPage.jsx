import { useNavigate } from "react-router-dom"
import { useState, useRef, useContext } from "react"
import { DataContext } from "../DataContext"
import "./style/SelectChairPage.css"
import chairImg from "./Image/Barber_chair.png"

export default function ChairPage(){
    const navigate = useNavigate();

    const [chairs, setChairs] = useState([
        { id: 1, name: "เก้าอี้ 1", status: "ready", statusText: "พร้อมให้บริการ", allowBooking: true },
        { id: 2, name: "เก้าอี้ 2", status: "waiting", statusText: "มีคิวรอ", allowBooking: true },
        { id: 3, name: "เก้าอี้ 3", status: "full", statusText: "คิวเต็มแล้ว", allowBooking: false },
        { id: 4, name: "เก้าอี้ 4", status: "full", statusText: "คิวเต็มแล้ว", allowBooking: false },
    ]);

    return (
        <div className="select-chair-page">
            <div className="back-nav">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <div className="chair-board-wrapper">
                <div className="chair-board">
                    <h2 className="board-title">
                        <svg className="scissor-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="6" cy="6" r="3"></circle>
                            <circle cx="6" cy="18" r="3"></circle>
                            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                            <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                            <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                        </svg>
                        <span>ตารางการให้บริการ</span>
                        <svg className="scissor-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="6" cy="6" r="3"></circle>
                            <circle cx="6" cy="18" r="3"></circle>
                            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                            <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                            <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                        </svg>
                    </h2>

                    <div className="chairs-grid">
                        {chairs.map(chair => (
                            <div key={chair.id} className="chair-card">
                                <div className="chair-image-container">
                                    <img src={chairImg} alt={chair.name} className="chair-image" />
                                </div>
                                <div className="chair-info">
                                    <span className="chair-name">{chair.name}</span>
                                    <div className={`status-badge status-${chair.status}`}>
                                        {chair.status === 'ready' && <span className="status-icon ready-icon">✔</span>}
                                        {chair.status === 'waiting' && <span className="status-icon waiting-icon"></span>}
                                        {chair.status === 'full' && <span className="status-icon full-icon"></span>}
                                        <span className="status-text">{chair.statusText}</span>
                                    </div>
                                </div>
                                <div className="card-divider"></div>
                                <button 
                                    className={`book-btn ${chair.allowBooking ? 'available' : 'unavailable'}`}
                                    disabled={!chair.allowBooking}
                                    onClick={() => navigate(`/booking/${chair.id}`)}
                                >
                                    {chair.allowBooking ? "จองเลย" : "จองไม่ได้"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}