import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { DataContext } from "../DataContext"; // สมมติว่าใช้เก็บ Base URL หรือสถานะกลาง
import "./style/ResetPasswordPage.css";


export default function ResetPassword() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isOtpPopup, setIsOtpPopup] = useState(false);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [shake, setShake] = useState(false);
    const [timer, setTimer] = useState(300);

    // ⏱️ นับเวลา OTP
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

    // 📩 ขอ OTP
    const handleRequestOTP = (e) => {
        e.preventDefault();
        setTimer(300);
        setIsOtpPopup(true);
    };

    // 🔐 ตรวจ OTP
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

        setIsOtpPopup(false);
        setStep(2);
    };

    // 🔁 รีเซ็ตรหัสผ่าน
    const handleResetPassword = () => {
        if (newPassword !== confirmPassword) {
            setError("❌ รหัสผ่านไม่ตรงกัน");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        alert("เปลี่ยนรหัสผ่านสำเร็จ 🎉");
        navigate("/login");
    };

    return (
        <div className="reset-password-layout">

            {/* 🔙 ปุ่มย้อนกลับ */}
            <button className="back-arrow-btn" onClick={() => navigate("/login")}>
                ←
            </button>

            <div className={`reset-card-box ${shake && step === 2 ? "shake" : ""}`}>
                <h2 className="reset-card-title">เปลี่ยนรหัสผ่าน</h2>

                {/* STEP 1: ใส่ Email */}
                {step === 1 && (
                    <form onSubmit={handleRequestOTP}>
                        <div className="input-field-wrapper">
                            <label>Email</label>
                            <input
                                type="email"
                                className="barber-input-style"
                                placeholder="โปรดป้อนที่อยู่อีเมล"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="center-button-wrapper">
                            <button type="submit" className="barber-btn-orange">
                                ขอรหัส OTP
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2: ตั้งรหัสใหม่ */}
                {step === 2 && (
                    <form>
                        {error && <div className="error-alert-box">{error}</div>}

                        <div className="input-field-wrapper">
                            <label>รหัสผ่านใหม่</label>
                            <input
                                type="password"
                                className="barber-input-style"
                                placeholder="รหัสผ่านใหม่"
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-field-wrapper">
                            <label>ยืนยันรหัสผ่าน</label>
                            <input
                                type="password"
                                className="barber-input-style"
                                placeholder="ยืนยันรหัสผ่าน"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="center-button-wrapper">
                            <button
                                type="button"
                                className="barber-btn-orange"
                                onClick={handleResetPassword}
                            >
                                ยืนยันการเปลี่ยนรหัส
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* 🔥 OTP POPUP */}
            {isOtpPopup && (
                <div className="otp-overlay-dark">
                    <div className={`otp-modal-box ${shake ? "shake" : ""}`}>
                        <h2 className="otp-modal-title">ยืนยันรหัส OTP</h2>

                        <p className="otp-modal-desc">
                            รหัสถูกส่งไปที่ <b>{email}</b><br />
                            จะหมดอายุภายใน{" "}
                            <span className={`otp-timer ${timer < 60 ? "urgent" : ""}`}>
                                {formatTime()}
                            </span>
                        </p>

                        <input
                            className="otp-dashed-input"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="- - - - - -"
                        />

                        <div className="center-button-wrapper">
                            <button
                                className="barber-btn-orange"
                                onClick={handleVerifyOtp}
                                disabled={timer === 0}
                            >
                                ยืนยันรหัส
                            </button>
                        </div>

                        <div className="otp-modal-footer">
                            <button className="otp-link" onClick={() => setIsOtpPopup(false)}>
                                ยกเลิก
                            </button>

                            <button
                                className="otp-link"
                                disabled={timer > 0}
                                onClick={() => setTimer(300)}
                            >
                                ส่งใหม่ {timer > 0 && `(${formatTime()})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔴 TOAST */}
            {showToast && (
                <div className="top-toast-notification">
                    <div className="toast-card">
                        <span className="toast-icon">⚠️</span>
                        <span>รหัส OTP ไม่ถูกต้อง</span>
                    </div>
                </div>
            )}
        </div>
    );
}