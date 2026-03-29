import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { DataContext } from "../DataContext";
import "./style/Home.css";

export default function Home() {
    const navigate = useNavigate();
    
    // ดึงค่าที่ Owner ตั้งค่าเอาไว้ (จาก DataContext)
    const { islogin, heroSlides, promoSlides, announcementText } = useContext(DataContext) || {};

    // --- 1. ระบบโฆษณาส่วนที่ 1 (Slideshow) ---
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
    const safeHeroSlides = (heroSlides && heroSlides.length > 0) ? heroSlides : ["/images/slide1.jpg"];
    const totalHeroSlides = safeHeroSlides.length;

    const prevHeroSlide = () => setCurrentHeroSlide((prev) => (prev - 1 + totalHeroSlides) % totalHeroSlides);
    const nextHeroSlide = () => setCurrentHeroSlide((prev) => (prev + 1) % totalHeroSlides);
    const goToHeroSlide = (index) => setCurrentHeroSlide(index);

    useEffect(() => {
        if (totalHeroSlides > 1) {
            const interval = setInterval(() => nextHeroSlide(), 5000);
            return () => clearInterval(interval);
        }
    }, [currentHeroSlide, totalHeroSlides]);

    // --- 2. ระบบโฆษณาส่วนที่ 2 (Fade) ---
    const [currentPromoSlide, setCurrentPromoSlide] = useState(0);
    const safePromoSlides = (promoSlides && promoSlides.length > 0) ? promoSlides : ["/images/slide2.jpg"];
    
    useEffect(() => {
        if (safePromoSlides.length > 1) {
            const interval = setInterval(() => {
                setCurrentPromoSlide((prev) => (prev + 1) % safePromoSlides.length);
            }, 4000); // สลับรูป Fade ทุกๆ 4 วินาที
            return () => clearInterval(interval);
        }
    }, [safePromoSlides.length]);

    // --- ฟังก์ชันดักจับปุ่มจองคิว ---
    const handleBookingClick = () => {
        if (!islogin) {
            navigate('/login');
        } else {
            navigate('/chair');
        }
    };

    return (
        <div className="w-full flex flex-col">
            
            {/* ========================================================== */}
            {/* โฆษณาส่วนที่ 1: Hero Slideshow */}
            {/* ========================================================== */}
            <section className="relative w-full h-[350px] md:h-[450px] bg-gray-900 overflow-hidden">
                <div 
                    className="flex transition-transform duration-500 ease-in-out h-full w-full" 
                    style={{ transform: `translateX(-${currentHeroSlide * 100}%)` }}
                >
                    {safeHeroSlides.map((imgSrc, index) => (
                        <div key={index} className="w-full h-full flex-shrink-0 relative flex items-center justify-center">
                            <img src={imgSrc} alt={`Hero ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                            {/* Overlay เงาดำจางๆ */}
                            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                        </div>
                    ))}
                </div>

                {/* โชว์ปุ่มเลื่อนและจุดไข่ปลา เฉพาะเวลาที่ Owner อัปรูปมากกว่า 1 รูป */}
                {totalHeroSlides > 1 && (
                    <>
                        <button onClick={prevHeroSlide} className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 text-white text-5xl hover:scale-110 transition z-20 drop-shadow-lg">&lsaquo;</button>
                        <button onClick={nextHeroSlide} className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 text-white text-5xl hover:scale-110 transition z-20 drop-shadow-lg">&rsaquo;</button>
                        
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                            {safeHeroSlides.map((_, index) => (
                                <div key={index} onClick={() => goToHeroSlide(index)} className={`w-3 h-3 rounded-full cursor-pointer transition-colors shadow-sm border border-gray-400 ${index === currentHeroSlide ? 'bg-[#ff9c2f]' : 'bg-white opacity-70 hover:opacity-100'}`}></div>
                            ))}
                        </div>
                    </>
                )}

            </section>

            {/* ========================================================== */}
            {/* โฆษณาส่วนที่ 2: Promo Fade */}
            {/* ========================================================== */}
            <section className="w-full py-16 md:py-20 bg-[#fffdf9] flex flex-col items-center">
                <h2 className="text-4xl md:text-5xl font-extrabold text-[#1c2a4f] mb-10 text-center">
                    ตัวอย่างทรงผม
                </h2>
                
                <div className="relative w-full max-w-4xl mx-auto px-6 mb-12">
                    <div className="w-full h-[250px] md:h-[400px] bg-gray-300 shadow-xl overflow-hidden relative p-6 rounded-md">
                         
                         {/* นำรูปภาพทั้งหมดมาซ้อนกัน แล้วสลับความโปร่งใส (Opacity) */}
                         {safePromoSlides.map((imgSrc, index) => (
                             <img 
                                key={index}
                                src={imgSrc} 
                                alt={`Promo ${index + 1}`} 
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentPromoSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} 
                             />
                         ))}
                    </div>
                    {/* 👇 นำโค้ดปุ่มมาวางแทรกตรงนี้ครับ 👇 */}
                    <div className="absolute bottom-6 right-10 md:bottom-6 md:right-12 z-50">
                        <button 
                            onClick={handleBookingClick}
                            className="bg-[#FFA333] hover:bg-[#ff8a00] text-black font-bold py-3 px-8 rounded border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none cursor-pointer"
                        >
                            กดจองคิว<br/>ตอนนี้เลย
                        </button>
                    </div>
                    {/* 👆 สิ้นสุดโค้ดปุ่ม 👆 */}
                </div>

                {/* ========================================================== */}
                {/* ส่วนที่ 3 ประวัติร้าน (แสดงผลด้านล่างสุด) */}
                {/* ========================================================== */}
                <div className="relative w-full max-w-4xl mx-auto px-6 mb-16 mt-4">
                    {/* ========================================================== */}
                    {/* ✅ แก้ไขที่ 2: เอากรอบสีดำ (border-2 border-black) และเงาออก */}
                    {/* ตามแบบในรูป Home5.jpg */}
                    {/* ========================================================== */}
                    <div className="w-full bg-white p-8 md:p-12 rounded-lg history-content">
                        {/* เรนเดอร์ข้อความที่เป็น HTML (ดึงจาก DataContext) */}
                        <div 
                            dangerouslySetInnerHTML={{ __html: announcementText || "<p>โปรดใส่ประวัติร้านในหน้าปรับแต่งเว็บไซต์...</p>" }} 
                        />
                    </div>
                    
                    {/* 🌟 ปุ่มจองคิวถูกย้ายออกไปจากตรงนี้แล้ว 🌟 */}
                </div>
            </section>
            
        </div>
    );
}