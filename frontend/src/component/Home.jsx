import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { DataContext } from "../DataContext";
import "./style/Home.css";

export default function Home() {
    const navigate = useNavigate();
    
    // ดึงค่าที่ Owner ตั้งค่าเอาไว้
    const { islogin, role, heroSlides, promoSlides, announcementText } = useContext(DataContext) || {};

    // --- 1. Hero Slideshow Logic ---
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
    const safeHeroSlides = (heroSlides && heroSlides.length > 0) ? heroSlides : ["/images/slide1.jpg"];
    const totalHeroSlides = safeHeroSlides.length;

    const nextHeroSlide = () => setCurrentHeroSlide((prev) => (prev + 1) % totalHeroSlides);
    const goToHeroSlide = (index) => setCurrentHeroSlide(index);

    useEffect(() => {
        if (totalHeroSlides > 1) {
            const interval = setInterval(() => nextHeroSlide(), 5000);
            return () => clearInterval(interval);
        }
    }, [currentHeroSlide, totalHeroSlides]);

    // --- 2. Promo Fade Logic ---
    const [currentPromoSlide, setCurrentPromoSlide] = useState(0);
    const safePromoSlides = (promoSlides && promoSlides.length > 0) ? promoSlides : ["/images/slide2.jpg"];
    
    useEffect(() => {
        if (safePromoSlides.length > 1) {
            const interval = setInterval(() => {
                setCurrentPromoSlide((prev) => (prev + 1) % safePromoSlides.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [safePromoSlides.length]);

    const handleBookingClick = () => {
        if (!islogin) {
            navigate('/login');
        } else if (role === 'EMPLOYEE' || role === 'OWNER') {
            navigate('/working-table');
        } else {
            navigate('/chair');
        }
    };

    return (
        <div className="home-container">
            
            {/* 1. Hero Section (Slideshow) */}
            <section className="hero-section">
                <div 
                    className="hero-track" 
                    style={{ transform: `translateX(-${currentHeroSlide * 100}%)` }}
                >
                    {safeHeroSlides.map((imgSrc, index) => (
                        <div key={index} className="hero-slide">
                            <img src={imgSrc} alt={`Hero ${index + 1}`} />
                            <div className="hero-overlay"></div>
                        </div>
                    ))}
                </div>

                {totalHeroSlides > 1 && (
                    <div className="hero-dots">
                        {safeHeroSlides.map((_, index) => (
                            <div 
                                key={index} 
                                onClick={() => goToHeroSlide(index)} 
                                className={`dot ${index === currentHeroSlide ? 'active' : ''}`}
                            ></div>
                        ))}
                    </div>
                )}
            </section>

            {/* 2. Promo & Booking Section */}
            <section className="promo-section">
                <div className="content-width">
                    <h2 className="section-title">สไตล์ที่ใช่สำหรับคุณ</h2>
                    
                    <div className="promo-display-container">
                        <div className="promo-fade-box">
                            {safePromoSlides.map((imgSrc, index) => (
                                <img 
                                    key={index}
                                    src={imgSrc} 
                                    alt={`Promo ${index + 1}`} 
                                    className={`promo-img ${index === currentPromoSlide ? 'active' : ''}`} 
                                />
                            ))}
                        </div>

                        {/* Floating Booking Button */}
                        <div className="floating-booking-area">
                            <button onClick={handleBookingClick} className="btn-main-booking">
                                <span className="btn-text-top">นัดหมายบริการ</span>
                                <span className="btn-text-main">จองคิวออนไลน์</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. History/Announcement Section */}
            <section className="announcement-section">
                <div className="content-width">
                    <div className="announcement-card">
                        <div className="card-decoration"></div>
                        <div 
                            className="announcement-html"
                            dangerouslySetInnerHTML={{ __html: announcementText || "<p>ยินดีต้อนรับสู่ร้านตัดผมของเรา...</p>" }} 
                        />
                    </div>
                </div>
            </section>
            
        </div>
    );
}