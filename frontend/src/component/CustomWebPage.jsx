import { useState, useContext, useEffect } from "react";
import { DataContext } from "../DataContext";
import { useNavigate } from "react-router-dom";
import "./style/CustomWebPage.css";

export default function CustomWebPage() {
    const navigate = useNavigate();
    
    // ดึง Context มาแบบปลอดภัย
    const context = useContext(DataContext) || {};

    // ดึงตัวแปรมาใช้งานแบบมี Fallback (ถ้าไม่มีให้ใช้ค่าเริ่มต้น)
    const heroSlides = context.heroSlides || [];
    const promoSlides = context.promoSlides || [];
    const announcementText = context.announcementText || "<h1>ใส่ข้อมูลร้านตรงนี้...</h1>"; // เปลี่ยนค่าเริ่มต้นให้เป็น HTML
    
    const setHeroSlides = context.setHeroSlides || null;
    const setPromoSlides = context.setPromoSlides || null;
    const setAnnouncementText = context.setAnnouncementText || null;

    // State สำหรับเก็บข้อมูลในหน้านี้ก่อนกดเซฟ
    const [localHero, setLocalHero] = useState([]);
    const [localPromo, setLocalPromo] = useState([]);
    const [localText, setLocalText] = useState("");

    // ดึงข้อมูลตอนเปิดหน้าเว็บ
    useEffect(() => {
        if (heroSlides.length > 0) setLocalHero(heroSlides);
        if (promoSlides.length > 0) setLocalPromo(promoSlides);
        if (announcementText) setLocalText(announcementText);
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
        // เช็คก่อนว่ามีฟังก์ชันให้เซฟไหม (ป้องกัน Error หน้าขาวตอนกดปุ่ม)
        if (setHeroSlides && setPromoSlides && setAnnouncementText) {
            setHeroSlides(localHero.length > 0 ? localHero : ["/images/slide1.jpg"]);
            setPromoSlides(localPromo.length > 0 ? localPromo : ["/images/slide2.jpg"]);
            setAnnouncementText(localText);
            
            alert("✅ อัปเดตหน้าเว็บไซต์เรียบร้อยแล้ว!");
            navigate("/"); 
        } else {
            alert("⚠️ ยังไม่สามารถบันทึกได้! กรุณาเพิ่ม State (heroSlides, promoSlides) ลงใน DataContext.jsx ตามที่แนะนำไปก่อนหน้านี้ครับ");
        }
    };

    return (
// 1. เติมคำว่า relative ไว้ที่ div กรอบนอกสุดของหน้าจอ
        <div className="min-h-screen bg-[#fffdf9] py-10 px-6 flex justify-center items-start w-full relative">
            
            {/* 2. ย้าย 🔙 ปุ่มลูกศรย้อนกลับ มาไว้ตรงนี้ (นอกกล่องสีส้ม) */}
            <div className="back-nav" style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
                <button className="back-btn" onClick={() => navigate("/")} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            {/* 3. เอาคำว่า relative ออกจากกล่องสีส้ม */}
            <div className="w-full max-w-4xl bg-[#FADDC9] shadow-[15px_15px_0px_0px_#D1CCC5] rounded-2xl p-8 border-2 border-[#5D4037]">
                
                <h1 style={{ textAlign: 'center' }} className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4 border-black">ปรับแต่งเว็บไซด์ (หน้าแรก)</h1>

                {/* --- โฆษณาส่วนที่ 1 --- */}
                <div className="mb-8 bg-orange-50 p-6 rounded-xl border border-orange-100">
                    <h2 className="text-xl font-bold text-black-800 mb-4">รูปโฆษณาส่วนที่ 1 (Hero Slideshow)</h2>
                    <p className="text-sm text-gray-600 mb-4">อัปโหลดรูปภาพเพื่อทำเป็นสไลด์โชว์ด้านบนสุดของเว็บ</p>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                        {localHero.map((img, index) => (
                            <div key={index} className="relative w-32 h-32 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                <img src={img} alt="hero" className="w-full h-full object-cover" />
                                <button onClick={() => handleRemoveImage(index, setLocalHero, localHero)} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold hover:bg-red-600">X</button>
                            </div>
                        ))}
                        <label className="w-32 h-32 flex flex-col items-center justify-center bg-white border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors">
                            <span className="text-black font-bold text-2xl">+</span>
                            <span className="text-xs text-gray-500 mt-1">เพิ่มรูปภาพ</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setLocalHero, localHero)} />
                        </label>
                    </div>
                </div>

                {/* --- โฆษณาส่วนที่ 2 --- */}
                <div className="mb-8 bg-orange-50 p-6 rounded-xl border border-orange-100">
                    <h2 className="text-xl font-bold text-black-800 mb-4">รูปโฆษณาส่วนที่ 2 (Promo Fade)</h2>
                    <p className="text-sm text-gray-600 mb-4">รูปภาพส่วนกลางที่จะค่อยๆ สลับภาพไปมา (Fade)</p>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                        {localPromo.map((img, index) => (
                            <div key={index} className="relative w-32 h-32 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                <img src={img} alt="promo" className="w-full h-full object-cover" />
                                <button onClick={() => handleRemoveImage(index, setLocalPromo, localPromo)} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold hover:bg-red-600">X</button>
                            </div>
                        ))}
                        <label className="w-32 h-32 flex flex-col items-center justify-center bg-white border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors">
                            <span className="text-black-500 font-bold text-2xl">+</span>
                            <span className="text-xs text-gray-500 mt-1">เพิ่มรูปภาพ</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setLocalPromo, localPromo)} />
                        </label>
                    </div>
                </div>

                {/* --- ประวัติร้าน --- */}
                <div className="mb-10 bg-orange-50 p-6 rounded-xl border border-orange-100 pink-frame-textarea">
                    <h2 className="text-xl font-bold text-black-800 mb-4">รายละเอียดเพิ่มเติม (แสดงผลด้านล่างสุดของหน้าแรก)</h2>
                    
                    {/* 🌟 🌟 🌟 เพิ่มคำแนะนำ HTML 🌟 🌟 🌟 */}
                    <div className="text-sm text-gray-500 mb-4 bg-white p-4 rounded-lg border border-orange-200">
                        คุณสามารถใช้แท็ก HTML เพื่อจัดรูปแบบข้อความได้เหมือนในตัวอย่างรูปภาพครับ (เริ่มต้นจะเป็นตัวอักษรขนาดเล็กตามที่คุณต้องการ)<br/>
                        <code className="text-orange-700 bg-orange-100 px-1 py-0.5 rounded">&lt;h1&gt;</code> - หัวข้อใหญ่มาก, 
                        <code className="text-orange-700 bg-orange-100 px-1 py-0.5 rounded">&lt;h2&gt;</code> - หัวข้อปานกลาง, 
                        <code className="text-orange-700 bg-orange-100 px-1 py-0.5 rounded">&lt;p&gt;</code> - ย่อหน้าปกติ, 
                        <code className="text-orange-700 bg-orange-100 px-1 py-0.5 rounded">&lt;b&gt;</code> - <b>ตัวหนา</b>
                    </div>

                    <textarea 
                        value={localText}
                        onChange={(e) => setLocalText(e.target.value)}
                        // 🌟 🌟 🌟 เปลี่ยน Placeholder ให้มีตัวอย่าง HTML 🌟 🌟 🌟
                        placeholder="เช่น <h1>ประวัติร้าน</h1><p>ร้านเปิดเมื่อปี 19xx...</p>"
                        className="w-full p-4 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none h-64 font-mono text-sm"
                    />
                </div>

                {/* --- ปุ่มบันทึก --- */}
                <div className="flex justify-end gap-4">
                    <button onClick={() => navigate("/")} className="px-6 py-3 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition-colors bg-white">ยกเลิก</button>
                    <button onClick={handleSave} className="bg-[#FFA333] hover:bg-[#ff8a00] text-black font-bold px-8 py-3 rounded-lg shadow-md transition-colors text-lg">
                        💾 บันทึกและอัปเดตเว็บไซต์
                    </button>
                </div>

            </div>
        </div>
    );
}