import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext, useMemo } from "react";
import { DataContext } from "../DataContext";
import "./style/Home.css";

export default function Home() {
    const navigate = useNavigate();
    const { islogin, role, heroSlides, promoSlides, announcementText, baseURL } = useContext(DataContext) || {};

    // จัดการ Path รูปภาพให้ถูกต้อง
    const getImgUrl = (imgData, fallback) => {
        if (!imgData) return fallback;
        if (typeof imgData === "string") return imgData; // รูป Default
        return `${baseURL}/${imgData.path_img}`; // รูปจาก Backend
    };

    // --- Logic Slideshow & Fade ---
    const [currHero, setCurrHero] = useState(0);
    const [currPromo, setCurrPromo] = useState(0);

    const safeHeros = useMemo(() => heroSlides?.length > 0 ? heroSlides : ["/images/slide1.jpg"], [heroSlides]);
    const safePromos = useMemo(() => promoSlides?.length > 0 ? promoSlides : ["/images/slide2.jpg"], [promoSlides]);

    useEffect(() => {
        const hInt = setInterval(() => setCurrHero(p => (p + 1) % safeHeros.length), 5000);
        const pInt = setInterval(() => setCurrPromo(p => (p + 1) % safePromos.length), 4000);
        return () => { clearInterval(hInt); clearInterval(pInt); };
    }, [safeHeros, safePromos]);

    return (
        <div className="home-container">
            {/* 1. Hero Section */}
            <section className="hero-section">
                <div className="hero-track" style={{ transform: `translateX(-${currHero * 100}%)` }}>
                    {safeHeros.map((img, i) => (
                        <div key={i} className="hero-slide">
                            <img src={getImgUrl(img, "/images/slide1.jpg")} alt="Banner" />
                            <div className="hero-overlay" />
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. Promo & Booking */}
            <section className="promo-section">
                <div className="promo-display-container">
                    <div className="promo-fade-box">
                        {safePromos.map((img, i) => (
                            <img key={i} src={getImgUrl(img, "/images/slide2.jpg")} 
                                 className={`promo-img ${i === currPromo ? 'active' : ''}`} alt="Promo" />
                        ))}
                    </div>
                    <button onClick={() => navigate(islogin ? (role === 'CUSTOMER' ? '/chair' : '/working-table') : '/login')} className="btn-main-booking">
                        <span className="btn-text-main">จองคิวออนไลน์</span>
                    </button>
                </div>
            </section>

            {/* 3. Description Section */}
            <section className="announcement-section">
                <div className="announcement-card">
                    <div className="announcement-html" 
                         dangerouslySetInnerHTML={{ __html: announcementText || "<h1>ยินดีต้อนรับ</h1>" }} />
                </div>
            </section>
        </div>
    );
}