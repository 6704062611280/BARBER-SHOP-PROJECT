import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext, useMemo } from "react";
import { DataContext } from "../DataContext";
import "./style/Home.css";

export default function Home() {
    const navigate = useNavigate();
    
    // ดึง authLoading มาเช็คด้วย เพื่อไม่ให้ปุ่มกระพริบตอนกำลังโหลด
    const { islogin, role, heroSlides, promoSlides, announcementText, baseURL, authLoading } = useContext(DataContext) || {};

    const getImgUrl = (imgData, fallback) => {
        if (!imgData) return fallback;
        if (typeof imgData === "string") return imgData; 
        return `${baseURL}/${imgData.path_img}`; 
    };

    const [currHero, setCurrHero] = useState(0);
    const [currPromo, setCurrPromo] = useState(0);

    const safeHeros = useMemo(() => heroSlides?.length > 0 ? heroSlides : ["/images/slide1.jpg"], [heroSlides]);
    const safePromos = useMemo(() => promoSlides?.length > 0 ? promoSlides : ["/images/slide2.jpg"], [promoSlides]);

    useEffect(() => {
        const hInt = setInterval(() => setCurrHero(p => (p + 1) % safeHeros.length), 5000);
        const pInt = setInterval(() => setCurrPromo(p => (p + 1) % safePromos.length), 4000);
        return () => { clearInterval(hInt); clearInterval(pInt); };
    }, [safeHeros, safePromos]);

    // 🔴 ฟังก์ชันคำนวณ Path สำหรับปุ่มจองคิว
    const handleBookingClick = () => {
        if (!islogin) {
            navigate('/login');
        } else {
            // เช็ค Role ให้ชัดเจน
            if (role === 'OWNER' || role === 'BARBER') {
                navigate('/working-table');
            } else {
                navigate('/chair');
            }
        }
    };

    // ถ้ายังโหลด Auth ไม่เสร็จ อาจจะโชว์ Loading หรือไม่โชว์ปุ่มก่อน
    if (authLoading) return <div className="loading-screen">กำลังโหลด...</div>;

    return (
        <div className="home-container">
            {/* ... ส่วน Hero ... */}
            
            <section className="promo-section">
                <div className="promo-display-container">
                    {/* ... ส่วนรูป Promo ... */}
                    
                    {/* เปลี่ยนการเรียก navigate ตรงๆ มาใช้ handleBookingClick */}
                    <button onClick={handleBookingClick} className="btn-main-booking">
                        <span className="btn-text-main">
                            {islogin ? "จัดการระบบ/จองคิว" : "เข้าสู่ระบบเพื่อจองคิว"}
                        </span>
                    </button>
                </div>
            </section>

            {/* ... ส่วน Description ... */}
        </div>
    );
}