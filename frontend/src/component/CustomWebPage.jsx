import { useState, useContext, useEffect } from "react";
import { DataContext } from "../DataContext";
import { useNavigate } from "react-router-dom";
import "./style/CustomWebPage.css";

export default function CustomWebPage() {
    const navigate = useNavigate();
    const context = useContext(DataContext) || {};

    const { 
        heroSlides = [], 
        promoSlides = [], 
        announcementText = "<h1>ข้อมูลร้านของคุณ</h1>",
        setHeroSlides, 
        setPromoSlides, 
        setAnnouncementText 
    } = context;

    const [localHero, setLocalHero] = useState([]);
    const [localPromo, setLocalPromo] = useState([]);
    const [localText, setLocalText] = useState("");

    useEffect(() => {
        setLocalHero(heroSlides);
        setLocalPromo(promoSlides);
        setLocalText(announcementText);
    }, [heroSlides, promoSlides, announcementText]);

    const handleFileUpload = (e, setState, currentState) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setState([...currentState, imageUrl]); 
        }
    };

    const handleRemoveImage = (index, setState, currentState) => {
        setState(currentState.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (setHeroSlides && setPromoSlides && setAnnouncementText) {
            setHeroSlides(localHero.length > 0 ? localHero : ["/images/slide1.jpg"]);
            setPromoSlides(localPromo.length > 0 ? localPromo : ["/images/slide2.jpg"]);
            setAnnouncementText(localText);
            alert("✅ บันทึกการตั้งค่าเรียบร้อย!");
            navigate("/"); 
        } else {
            alert("⚠️ ระบบบันทึกยังไม่พร้อมใช้งาน");
        }
    };

    return (
        <div className="custom-page-wrapper">
            {/* Header Navigation */}
            <header className="custom-header">
                <button className="back-circle-btn" onClick={() => navigate("/")}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="header-text">
                    <h1>ปรับแต่งหน้าเว็บไซต์</h1>
                    <p>จัดการรูปภาพและข้อมูลร้านค้าของคุณ</p>
                </div>
            </header>

            <main className="custom-content">
                {/* Section 1: Hero Slides */}
                <section className="config-section">
                    <div className="section-info">
                        <h2>ส่วนหัวเว็บไซต์ (Hero Slideshow)</h2>
                        <p>รูปภาพขนาดใหญ่ที่จะแสดงเป็นสไลด์ด้านบนสุด</p>
                    </div>
                    <div className="image-grid">
                        {localHero.map((img, index) => (
                            <div key={index} className="img-preview-card">
                                <img src={img} alt="hero" />
                                <button className="remove-img-btn" onClick={() => handleRemoveImage(index, setLocalHero, localHero)}>×</button>
                            </div>
                        ))}
                        <label className="upload-placeholder">
                            <span className="plus-icon">+</span>
                            <span className="upload-text">เพิ่มรูปภาพ</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setLocalHero, localHero)} />
                        </label>
                    </div>
                </section>

                {/* Section 2: Promo Fade */}
                <section className="config-section">
                    <div className="section-info">
                        <h2>ภาพผลงาน/โปรโมชั่น (Promo Fade)</h2>
                        <p>รูปภาพส่วนกลางที่จะค่อยๆ สลับภาพ (Fade) แสดงตัวอย่างทรงผม</p>
                    </div>
                    <div className="image-grid">
                        {localPromo.map((img, index) => (
                            <div key={index} className="img-preview-card">
                                <img src={img} alt="promo" />
                                <button className="remove-img-btn" onClick={() => handleRemoveImage(index, setLocalPromo, localPromo)}>×</button>
                            </div>
                        ))}
                        <label className="upload-placeholder">
                            <span className="plus-icon">+</span>
                            <span className="upload-text">เพิ่มรูปภาพ</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setLocalPromo, localPromo)} />
                        </label>
                    </div>
                </section>

                {/* Section 3: History & Info */}
                <section className="config-section">
                    <div className="section-info">
                        <h2>รายละเอียดร้าน (ประวัติ/ข้อมูลติดต่อ)</h2>
                        <p>ใช้ HTML สำหรับจัดรูปแบบ (เช่น &lt;h1&gt;, &lt;p&gt;, &lt;b&gt;)</p>
                    </div>
                    <div className="editor-container">
                        <textarea 
                            value={localText}
                            onChange={(e) => setLocalText(e.target.value)}
                            placeholder="ตัวอย่าง: <h1>ชื่อร้าน</h1><p>ประวัติความเป็นมา...</p>"
                            className="modern-textarea"
                        />
                    </div>
                </section>

                {/* Action Footer */}
                <footer className="custom-actions">
                    <button className="btn-cancel" onClick={() => navigate("/")}>ยกเลิก</button>
                    <button className="btn-save-main" onClick={handleSave}>
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </footer>
            </main>
        </div>
    );
}