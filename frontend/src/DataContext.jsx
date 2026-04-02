import { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

export const DataContext = createContext();

export function DataProvider({ children }) {
    const [role, setRole] = useState(null);
    const [islogin, setIsLogin] = useState(false);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("ชื่อผู้ใช้งาน");
    const [profileImg, setProfileImg] = useState("");
    const [userData, setUserData] = useState(null); // เก็บข้อมูลผู้ใช้อื่นๆ (ถ้ามี)

    const baseURL = import.meta.env.VITE_API_URL;

    // 🔄 ฟังก์ชันดึงข้อมูล Profile จาก Backend
    const fetchUserData = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`${baseURL}/auth/profile`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });

            if (response.ok) {
                const data = await response.json();
                
                // อัปเดต State ทุกตัวด้วยข้อมูลจริงจาก DB
                setUserId(data.id);
                setUsername(data.username);
                setProfileImg(data.profile_img || "");
                setRole(data.rolestatus); // OWNER, EMPLOYEE, CUSTOMER
                setUserData(data); // เก็บก้อนข้อมูลทั้งหมดเผื่อใช้ในหน้า Profile
                setIsLogin(true);
            } else if (response.status === 401) {
                // ถ้า Token หมดอายุ หรือไม่ถูกต้อง
                handleLogout();
            }
        } catch (err) {
            console.error("Fetch user error:", err);
        }
    }, [baseURL]);

    // 🚪 ฟังก์ชันออกจากระบบ
    const handleLogout = () => {
        localStorage.removeItem("token");
        setRole(null);
        setUserId(null);
        setIsLogin(false);
        setUsername("ชื่อผู้ใช้งาน");
        setProfileImg("");
        setUserData(null);
    };

    // 🛠 ตรวจสอบสถานะการ Login ครั้งแรกที่เปิดเว็บ
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                // ตรวจสอบเบื้องต้นผ่าน JWT
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                
                if (decoded.exp < currentTime) {
                    handleLogout(); // Token หมดอายุ
                } else {
                    fetchUserData(); // ดึงข้อมูลล่าสุดจาก DB
                }
            } catch (e) {
                handleLogout();
            }
        }
    }, [fetchUserData]);

    return (
        <DataContext.Provider value={{
            role, setRole,
            userId, setUserId,
            islogin, setIsLogin, 
            username, setUsername, 
            profileImg, setProfileImg,
            userData, // ส่งก้อนข้อมูลทั้งหมดไปด้วย
            fetchUserData, 
            handleLogout, // ส่งฟังก์ชัน logout ไปใช้ใน Navbar
            baseURL
        }}>
            {children}
        </DataContext.Provider>
    );
}