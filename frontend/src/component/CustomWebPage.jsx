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
        <div className="min-h-screen bg-[#fffdf9] py-10 px-6 flex justify-center items-start w-full">
            <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">🛠️ ปรับแต่งเว็บไซด์ (หน้าแรก)</h1>

                {/* --- 1. กรอบสีแดง: โฆษณาส่วนที่ 1 --- */}
                <div className="mb-8 bg-red-50 p-6 rounded-xl border border-red-100">
                    <h2 className="text-xl font-bold text-red-800 mb-4">โฆษณาส่วนที่ 1 (Hero Slideshow)</h2>
                    <p className="text-sm text-gray-600 mb-4">อัปโหลดรูปภาพเพื่อทำเป็นสไลด์โชว์ด้านบนสุดของเว็บ</p>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                        {localHero.map((img, index) => (
                            <div key={index} className="relative w-32 h-32 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                <img src={img} alt="hero" className="w-full h-full object-cover" />
                                <button onClick={() => handleRemoveImage(index, setLocalHero, localHero)} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold hover:bg-red-600">X</button>
                            </div>
                        ))}
                        <label className="w-32 h-32 flex flex-col items-center justify-center bg-white border-2 border-dashed border-red-300 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                            <span className="text-red-500 font-bold text-2xl">+</span>
                            <span className="text-xs text-gray-500 mt-1">เพิ่มรูปภาพ</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setLocalHero, localHero)} />
                        </label>
                    </div>
                </div>

                {/* --- 2. กรอบสีน้ำเงิน: โฆษณาส่วนที่ 2 --- */}
                <div className="mb-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h2 className="text-xl font-bold text-blue-800 mb-4">โฆษณาส่วนที่ 2 (Promo Fade)</h2>
                    <p className="text-sm text-gray-600 mb-4">รูปภาพส่วนกลางที่จะค่อยๆ สลับภาพไปมา (Fade)</p>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                        {localPromo.map((img, index) => (
                            <div key={index} className="relative w-32 h-32 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                <img src={img} alt="promo" className="w-full h-full object-cover" />
                                <button onClick={() => handleRemoveImage(index, setLocalPromo, localPromo)} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold hover:bg-red-600">X</button>
                            </div>
                        ))}
                        <label className="w-32 h-32 flex flex-col items-center justify-center bg-white border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                            <span className="text-blue-500 font-bold text-2xl">+</span>
                            <span className="text-xs text-gray-500 mt-1">เพิ่มรูปภาพ</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setLocalPromo, localPromo)} />
                        </label>
                    </div>
                </div>

                {/* --- 3. ✅ เปลี่ยนแปลงที่ 2: กรอบสีเขียว: ประวัติร้าน --- */}
                <div className="mb-10 bg-green-50 p-6 rounded-xl border border-green-100 pink-frame-textarea">
                    <h2 className="text-xl font-bold text-green-800 mb-4">ประวัติร้าน (แสดงผลด้านล่างสุดของหน้าแรก)</h2>
                    
                    {/* 🌟 🌟 🌟 เพิ่มคำแนะนำ HTML 🌟 🌟 🌟 */}
                    <div className="text-sm text-gray-500 mb-4 bg-white p-4 rounded-lg border border-green-200">
                        คุณสามารถใช้แท็ก HTML เพื่อจัดรูปแบบข้อความได้เหมือนในตัวอย่างรูปภาพครับ (เริ่มต้นจะเป็นตัวอักษรขนาดเล็กตามที่คุณต้องการ)<br/>
                        <code className="text-green-700 bg-green-100 px-1 py-0.5 rounded">&lt;h1&gt;</code> - หัวข้อใหญ่มาก, 
                        <code className="text-green-700 bg-green-100 px-1 py-0.5 rounded">&lt;h2&gt;</code> - หัวข้อปานกลาง, 
                        <code className="text-green-700 bg-green-100 px-1 py-0.5 rounded">&lt;p&gt;</code> - ย่อหน้าปกติ, 
                        <code className="text-green-700 bg-green-100 px-1 py-0.5 rounded">&lt;b&gt;</code> - <b>ตัวหนา</b>
                    </div>

                    <textarea 
                        value={localText}
                        onChange={(e) => setLocalText(e.target.value)}
                        // 🌟 🌟 🌟 เปลี่ยน Placeholder ให้มีตัวอย่าง HTML 🌟 🌟 🌟
                        placeholder="เช่น <h1>ประวัติร้าน</h1><p>ร้านเปิดเมื่อปี 19xx...</p>"
                        className="w-full p-4 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none h-64 font-mono text-sm"
                    />
                </div>

                {/* --- ปุ่มบันทึก --- */}
                <div className="flex justify-end gap-4">
                    <button onClick={() => navigate("/")} className="px-6 py-3 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition-colors">ยกเลิก</button>
                    <button onClick={handleSave} className="bg-[#ff9c2f] hover:bg-[#ff8a00] text-black font-bold px-8 py-3 rounded-lg shadow-md border border-orange-400 transition-colors text-lg">
                        💾 บันทึกและอัปเดตเว็บไซต์
                    </button>
                </div>

            </div>
        </div>
    );
}