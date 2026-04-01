import { useNavigate } from "react-router-dom"
import { useState, useRef, useContext, useEffect } from "react"
import { DataContext } from "../DataContext"
import "./style/RegisterPage.css"



export default function RegisterPage() {
    const navigate = useNavigate();

    const [isOtpPopup, setIsOtpPopup] = useState(false);
    const [formData, setFormData] = useState({
        username: "", password: "", passcheck: "",
        firstname: "", lastname: "", email: "", phone: ""
    });

    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(300);
    const [error, setError] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        let interval;
        if (isOtpPopup && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isOtpPopup, timer]);

    const formatTime = () => {
        const m = Math.floor(timer / 60);
        const s = timer % 60;
        return `${m}:${s < 10 ? `0${s}` : s}`;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.passcheck) {
            setError("❌ รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }
        setError("");
        setTimer(300);
        setIsOtpPopup(true);
    };

    const handleVerifyOtp = () => {
        if (otp !== "123456") {
            setShowToast(true);
            setShake(true);
            setTimeout(() => {
                setShowToast(false);
                setShake(false);
            }, 3000);
            return;
        }
        alert("สมัครสมาชิกสำเร็จ 🎉");
        navigate("/login");
    };

    return (
        <div className="register-main-layout">
            <div className={`register-card-container ${shake && !isOtpPopup ? "shake" : ""}`}>
                <div className="register-header-section">
                    <h2 className="register-main-title">สร้างบัญชีผู้ใช้</h2>
                </div>

                {error && <div className="error-alert-box">{error}</div>}

                <form onSubmit={handleRegisterSubmit} className="register-form-body">
                    <div className="input-row-flex">
                        <div className="input-field-group">
                            <label>ชื่อ</label>
                            <input name="firstname" placeholder="ชื่อจริง" onChange={handleChange} required />
                        </div>
                        <div className="input-field-group">
                            <label>นามสกุล</label>
                            <input name="lastname" placeholder="นามสกุล" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-field-group">
                        <label>ชื่อบัญชีผู้ใช้</label>
                        <input name="username" placeholder="ใส่ชื่อบัญชีผู้ใช้" onChange={handleChange} required />
                    </div>

                    <div className="input-field-group">
                        <label>หมายเลขโทรศัพท์</label>
                        <input name="phone" placeholder="0xx-xxx-xxxx" onChange={handleChange} required />
                    </div>

                    <div className="input-field-group">
                        <label>อีเมล</label>
                        <input name="email" type="email" placeholder="ใส่ชื่ออีเมล" onChange={handleChange} required />
                    </div>

                    <div className="input-field-group">
                        <label>รหัสผ่าน</label>
                        <input type="password" name="password" placeholder="ใส่รหัสผ่าน" onChange={handleChange} required />
                    </div>

                    <div className="input-field-group">
                        <label>ยืนยันรหัสผ่านอีกครั้ง</label>
                        <input type="password" name="passcheck" placeholder="ยืนยันรหัสผ่าน" onChange={handleChange} required />
                    </div>


                    {/* ส่วนล่างของฟอร์มสมัครสมาชิก */}
                    <div className="form-footer-action">
                        <div className="center-button-wrapper">
                            <button type="submit" className="barber-btn-orange">สร้างบัญชีผู้ใช้</button>
                        </div>

                        {/* เว้นระยะห่างและเพิ่มฟังก์ชันลิงก์ไปหน้า Login */}
                        <p className="login-nav-text">
                            มีบัญชีแล้ว? <span className="login-link-span" onClick={() => navigate("/login")}>เข้าสู่ระบบ</span>
                        </p>
                    </div>
                </form>
            </div>

            {/* OTP Popup Overlay มืดสนิท ไม่เบลอ */}
            {isOtpPopup && (
                <div className="otp-overlay-dark">
                    <div className={`otp-modal-box ${shake ? "shake" : ""}`}>
                        <h2 className="otp-modal-title">ยืนยันรหัส OTP</h2>
                        <p className="otp-modal-desc">
                            รหัสถูกส่งไปที่ <b>{formData.email}</b><br />
                            จะหมดอายุภายใน <span className={`otp-timer ${timer < 60 ? "urgent" : ""}`}>{formatTime()}</span> นาที
                        </p>

                        <input
                            className="otp-dashed-input"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="- - - - - -"
                        />

                        <div className="center-button-wrapper">
                            <button className="barber-btn-orange" onClick={handleVerifyOtp} disabled={timer === 0}>
                                ยืนยันรหัส
                            </button>
                        </div>

                        <div className="otp-modal-footer">
                            <button className="otp-link" onClick={() => setIsOtpPopup(false)}>แก้ไขข้อมูล</button>
                            <button className="otp-link" disabled={timer > 0} onClick={() => setTimer(300)}>
                                ส่งรหัสอีกครั้ง {timer > 0 && `(${formatTime()})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast แจ้งเตือนด้านบนสุด */}
            {showToast && (
                <div className="top-toast-notification">
                    <div className="toast-card">
                        <span className="toast-icon">⚠️</span>
                        <span>รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่</span>
                    </div>
                </div>
            )}
        </div>
    );
}