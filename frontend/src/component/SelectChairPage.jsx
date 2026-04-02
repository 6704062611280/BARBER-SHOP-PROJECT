import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext, useCallback } from "react";
import { DataContext } from "../DataContext";
import "./style/SelectChairPage.css";
import chairImg from "./Image/Barber_chair.png";

export default function ChairPage() {
    const navigate = useNavigate();
    const { baseURL } = useContext(DataContext);

    const [chairs, setChairs] = useState([]);
    const [shopStatus, setShopStatus] = useState("loading");
    const [loading, setLoading] = useState(true);
    const [todayTH, setTodayTH] = useState("");

    useEffect(() => {
        setTodayTH(new Date().toLocaleDateString("th-TH", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        }));
    }, []);

    const fetchChairs = useCallback(async () => {
        setLoading(true);
        try {
            // ดึงวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD เพื่อส่งไปให้ Backend
            const today = new Date().toISOString().split("T")[0];
            const res = await fetch(`${baseURL}/queue_service/chairs?dateshop=${today}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });

            if (!res.ok) { 
                setShopStatus("closed"); 
                return; 
            }

            const data = await res.json();
            
            // ตรวจสอบสถานะร้านจาก JSON ที่ Backend ส่งมา (shop_status: "open" / "closed")
            if (data.shop_status === "closed") {
                setShopStatus("closed");
                return;
            }

            // Mapping ข้อมูลจาก Backend (ใช้ field names ให้ตรงกับ Python)
            const enriched = (data.chairs || []).map(chair => ({
                id: chair.id,
                name: chair.name,
                status: chair.status,           // "ready", "full", "not_ready"
                statusText: chair.statusText,   // "พร้อมให้บริการ", "คิวเต็ม", ฯลฯ
                allowBooking: chair.allowBooking,
                barberName: chair.barber_name   // ชื่อช่างจาก Backend
            }));

            setChairs(enriched);
            setShopStatus("open");
        } catch (error) {
            console.error("Fetch chairs error:", error);
            setShopStatus("closed");
        } finally {
            setLoading(false);
        }
    }, [baseURL]);

    useEffect(() => { 
        fetchChairs(); 
    }, [fetchChairs]);

    // หน้าจอ Loading
    if (loading) {
        return (
            <div className="sc-loading-screen">
                <div className="sc-spinner" />
                <p>กำลังตรวจสอบสถานะร้าน...</p>
            </div>
        );
    }

    // หน้าจอเมื่อร้านปิด (ยังไม่ได้กด Open Shop หรือตั้งค่าปิดร้าน)
    if (shopStatus === "closed") {
        return (
            <div className="sc-page">
                <button className="sc-back-btn" onClick={() => navigate("/")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                    </svg>
                </button>
                <div className="sc-closed-card">
                    <div className="sc-closed-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0774A" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <h2 className="sc-closed-title">ขออภัย ร้านปิดบริการ</h2>
                    <p className="sc-closed-sub">ขณะนี้ระบบยังไม่เปิดให้จองคิว<br />กรุณาติดต่อใหม่ภายหลังหรือตรวจสอบเวลาเปิดร้าน</p>
                    <button className="sc-home-btn" onClick={() => navigate("/")}>กลับหน้าหลัก</button>
                </div>
            </div>
        );
    }

    return (
        <div className="sc-page">
            <button className="sc-back-btn" onClick={() => navigate(-1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
            </button>

            <div className="sc-board">
                <div className="sc-board-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6020" strokeWidth="2">
                        <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                        <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                        <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                        <line x1="8.12" y1="8.12" x2="12" y2="12"/>
                    </svg>
                    <span>เลือกเก้าอี้ที่ต้องการจอง</span>
                </div>
                <p className="sc-date">{todayTH}</p>

                {chairs.length === 0 ? (
                    <p className="sc-empty">ไม่มีเก้าอี้ให้บริการในขณะนี้</p>
                ) : (
                    <div className="sc-grid">
                        {chairs.map(chair => (
                            <div key={chair.id} className={`sc-card sc-card-${chair.status}`}>
                                <div className="sc-img-wrap">
                                    <img
                                        src={chairImg}
                                        alt={chair.name}
                                        className="sc-chair-img"
                                        style={!chair.allowBooking ? { filter: "grayscale(1) opacity(.45)" } : {}}
                                    />
                                </div>
                                <div className="sc-info">
                                    <span className="sc-name">{chair.name}</span>
                                    {chair.barberName && (
                                        <span className="sc-barber">ช่าง: {chair.barberName}</span>
                                    )}
                                    <div className={`sc-badge sc-badge-${chair.status}`}>
                                        <div className="sc-dot" />
                                        <span>{chair.statusText}</span>
                                    </div>
                                </div>
                                <div className="sc-divider" />
                                <button
                                    className={`sc-btn ${chair.allowBooking ? "sc-btn-book" : "sc-btn-full"}`}
                                    disabled={!chair.allowBooking}
                                    onClick={() => chair.allowBooking && navigate(`/booking/${chair.id}`)}
                                >
                                    {chair.allowBooking ? "เลือกเวลาจอง" : chair.statusText}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}