import { useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { DataContext } from "../DataContext";

export default function ShopSetting() {
    const navigate = useNavigate();
    
    // ดึง Context มาแบบปลอดภัย
    const context = useContext(DataContext) || {};
    const shopOpenTime = context.shopOpenTime || "10:00";
    const shopCloseTime = context.shopCloseTime || "20:00";
    const shopStatus = context.shopStatus || "open"; 
    
    const setShopOpenTime = context.setShopOpenTime || null;
    const setShopCloseTime = context.setShopCloseTime || null;
    const setShopStatus = context.setShopStatus || null;

    // State สำหรับเก็บข้อมูลในหน้านี้ก่อนกดเซฟ
    const [localOpenTime, setLocalOpenTime] = useState("10:00");
    const [localCloseTime, setLocalCloseTime] = useState("20:00");
    const [localShopStatus, setLocalShopStatus] = useState("open");

    // State สำหรับระบบ Popup รหัสผ่าน
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [pendingChange, setPendingChange] = useState(null);

    // ดึงข้อมูลตอนเปิดหน้าเว็บ
    useEffect(() => {
        if (shopOpenTime) setLocalOpenTime(shopOpenTime);
        if (shopCloseTime) setLocalCloseTime(shopCloseTime);
        if (shopStatus) setLocalShopStatus(shopStatus);
    }, [shopOpenTime, shopCloseTime, shopStatus]);

    const handleSave = () => {
        if (setShopOpenTime && setShopCloseTime && setShopStatus) {
            setShopOpenTime(localOpenTime);
            setShopCloseTime(localCloseTime);
            setShopStatus(localShopStatus);
            alert("✅ บันทึกการตั้งค่าเรียบร้อยแล้ว!");
            navigate("/");
        } else {
            alert("⚠️ ยังไม่สามารถบันทึกได้! กรุณาไปเพิ่ม State ใน DataContext.jsx");
        }
    };

    const handleProtectedChange = (field, value) => {
        setPendingChange({ field, value });
        setPasswordInput("");
        setShowPasswordModal(true);
    };

    const confirmPassword = () => {
        if (passwordInput === "1234") {
            setShowPasswordModal(false);
            setShowSuccessModal(true);
        } else {
            alert("❌ รหัสผ่านไม่ถูกต้อง (ลองใส่ 1234)");
        }
    };

    const handleSuccessDone = () => {
        if (pendingChange.field === 'openTime') setLocalOpenTime(pendingChange.value);
        if (pendingChange.field === 'closeTime') setLocalCloseTime(pendingChange.value);
        if (pendingChange.field === 'shopStatus') setLocalShopStatus(pendingChange.value);
        
        setShowSuccessModal(false);
        setPendingChange(null);
    };

    const timeOptions = [
        "10:00", "11:00", "12:00", "13:00", "14:00", 
        "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
    ];

    return (
        <div className="min-h-screen bg-[#fffdf9] py-10 px-6 flex justify-center items-start w-full relative">
            
            <div className="back-nav" style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
                <button className="back-btn" onClick={() => navigate("/")} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <div className="w-full max-w-4xl bg-[#FADDC9] shadow-[15px_15px_0px_0px_#D1CCC5] rounded-2xl p-8 border-2 border-[#5D4037]">
                
                <h1 style={{ textAlign: 'center' }} className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4 border-black">
                    จัดการคิว & สถานะร้าน
                </h1>

                {/* --- ส่วนที่ 1: สถานะร้าน (Shop Status) --- */}
                <div className="mb-8 bg-orange-50 p-6 rounded-xl border border-orange-100">
                    <h2 className="text-xl font-bold text-black-800 mb-2 text-center">สถานะร้าน (Shop Status)</h2>
                    <p className="text-sm text-gray-600 mb-6 text-center">ควบคุมการเปิด-ปิดรับจองคิวของร้านในระบบ</p>
                    
                    <div className="flex flex-col md:flex-row gap-6 bg-white p-5 rounded-lg border border-orange-200 shadow-sm">
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-green-50 rounded-lg transition-colors flex-1">
                            <input 
                                type="radio" 
                                name="shopStatus" 
                                value="open" 
                                checked={localShopStatus === "open"} 
                                onChange={(e) => handleProtectedChange('shopStatus', e.target.value)} 
                                className="w-6 h-6 text-green-500 focus:ring-green-400" 
                            />
                            <span className="font-bold text-green-600 text-xl">✅ เปิด (Open)</span>
                        </label>
                        <div className="hidden md:block w-px bg-gray-200"></div>
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-red-50 rounded-lg transition-colors flex-1">
                            <input 
                                type="radio" 
                                name="shopStatus" 
                                value="close" 
                                checked={localShopStatus === "close"} 
                                onChange={(e) => handleProtectedChange('shopStatus', e.target.value)} 
                                className="w-6 h-6 text-red-500 focus:ring-red-400" 
                            />
                            <span className="font-bold text-red-600 text-xl">❌ ปิด (Close)</span>
                        </label>
                    </div>
                </div>

                {/* --- 🌟 ส่วนที่ 2: ช่วงเวลาคิว (จะแสดงผลเฉพาะตอนเลือก "เปิดรับจอง" เท่านั้น) --- */}
                {localShopStatus === "open" && (
                    <div className="mb-10 bg-orange-50 p-6 rounded-xl border border-orange-100 flex flex-col items-center">
                        <h2 className="text-xl font-bold text-black-800 mb-2 text-center">ช่วงเวลาคิว</h2>
                        <p className="text-sm text-gray-600 mb-6 text-center">กำหนดเวลาเปิดและปิดร้าน (เพิ่ม-ลดได้ทีละ 1 ชั่วโมง)</p>
                        
                        <div className="flex flex-row items-center gap-4 bg-white p-4 rounded-lg border border-orange-200 shadow-sm w-full max-w-md justify-center">
                            <select 
                                value={localOpenTime}
                                onChange={(e) => handleProtectedChange('openTime', e.target.value)}
                                className="p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-lg font-bold text-center cursor-pointer bg-gray-50"
                            >
                                {timeOptions.map(time => (
                                    <option key={`open-${time}`} value={time}>{time}</option>
                                ))}
                            </select>

                            <span className="text-xl font-bold text-gray-600">-</span>

                            <select 
                                value={localCloseTime}
                                onChange={(e) => handleProtectedChange('closeTime', e.target.value)}
                                className="p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-lg font-bold text-center cursor-pointer bg-gray-50"
                            >
                                {timeOptions.map(time => (
                                    <option key={`close-${time}`} value={time} disabled={time <= localOpenTime}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* --- ปุ่มบันทึก --- */}
                <div className="flex justify-end gap-4 justify-center">
                    <button onClick={() => navigate("/")} className="px-6 py-3 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition-colors bg-white">ยกเลิก</button>
                    <button onClick={handleSave} className="bg-[#FFA333] hover:bg-[#ff8a00] text-black font-bold px-8 py-3 rounded-lg shadow-md transition-colors text-lg">
                        ยืนยัน
                    </button>
                </div>

            </div>

            {/* Popup ใส่รหัสผ่าน */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative border-2 border-[#5D4037] flex flex-col items-center">
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-800" onClick={() => setShowPasswordModal(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 mt-2">ยืนยันรหัสผ่าน</h3>
                        <input 
                            type="password" 
                            placeholder="รหัสผ่าน" 
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full p-4 border-2 border-orange-200 rounded-xl mb-8 outline-none focus:border-orange-500 text-center text-lg tracking-widest"
                        />
                        <div className="flex gap-4 w-full">
                            <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">
                                ยกเลิก
                            </button>
                            <button onClick={confirmPassword} className="flex-1 py-3 bg-[#FFA333] hover:bg-[#ff8a00] text-black font-bold rounded-xl shadow-md transition-colors">
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup สำเร็จ */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center border-2 border-[#5D4037]">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-8">รหัสผ่านถูกต้อง</h3>
                        <button onClick={handleSuccessDone} className="w-full py-4 bg-[#FFA333] hover:bg-[#ff8a00] text-black font-bold rounded-xl shadow-md transition-colors text-lg">
                            เสร็จสิ้น
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}