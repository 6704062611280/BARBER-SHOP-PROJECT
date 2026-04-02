import { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

export const DataContext = createContext();

export function DataProvider({ children }) {
    const [role, setRole] = useState(null);
    const [islogin, setIsLogin] = useState(false);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("ชื่อผู้ใช้งาน");
    const [profileImg, setProfileImg] = useState("");
    const [userData, setUserData] = useState(null);

    // --- State สำหรับหน้า Home / ปรับแต่งเว็บ ---
    const [heroSlides, setHeroSlides] = useState([]);      // เก็บรูป BANNER
    const [promoSlides, setPromoSlides] = useState([]);    // เก็บรูป MAIN_IMG
    const [announcementText, setAnnouncementText] = useState(""); // เก็บ HTML Description

    const baseURL = import.meta.env.VITE_API_URL;

    // 🔄 1. ฟังก์ชันดึงข้อมูล Profile
    const fetchUserData = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const response = await fetch(`${baseURL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setUserId(data.id);
                setUsername(data.username);
                setProfileImg(data.profile_img || "");
                setRole(data.rolestatus);
                setUserData(data);
                setIsLogin(true);
            } else {
                handleLogout();
            }
        } catch (err) {
            console.error("Fetch user error:", err);
        }
    }, [baseURL]);

    // 🔄 2. ฟังก์ชันดึงข้อมูลการตั้งค่าเว็บไซต์ (รูปภาพและข้อความ)
    const fetchWebsiteConfig = useCallback(async () => {
        try {
            // ดึงรูปภาพ
            const imgRes = await fetch(`${baseURL}/data_service/website/images`);
            if (imgRes.ok) {
                const imgData = await imgRes.json();
                setHeroSlides(imgData.BANNER || []);
                setPromoSlides(imgData.MAIN_IMG || []);
            }

            // ดึงข้อความประกาศ
            const descRes = await fetch(`${baseURL}/data_service/website/description`);
            if (descRes.ok) {
                const descData = await descRes.json();
                setAnnouncementText(descData.massege || "");
            }
        } catch (err) {
            console.error("Fetch website config error:", err);
        }
    }, [baseURL]);

    // 🚪 ฟังก์ชันออกจากระบบ
    const handleLogout = () => {
        localStorage.removeItem("token");
        setRole(null);
        setUserId(null);
        setIsLogin(false);
        setUserData(null);
    };

    // 🛠 โหลดข้อมูลครั้งแรกเมื่อเปิดแอป
    useEffect(() => {
        fetchWebsiteConfig(); // ดึงข้อมูลหน้าเว็บ (ไม่ต้องรอ Login)
        
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp < Date.now() / 1000) handleLogout();
                else fetchUserData();
            } catch (e) { handleLogout(); }
        }
    }, [fetchUserData, fetchWebsiteConfig]);

    return (
        <DataContext.Provider value={{
            role, setRole,
            userId, setUserId,
            islogin, setIsLogin, 
            username, setUsername, 
            profileImg, setProfileImg,
            userData,
            fetchUserData, 
            handleLogout,
            baseURL,
            // ส่ง State และ Function เกี่ยวกับหน้าเว็บออกไป
            heroSlides, setHeroSlides,
            promoSlides, setPromoSlides,
            announcementText, setAnnouncementText,
            fetchWebsiteConfig
        }}>
            {children}
        </DataContext.Provider>
    );
}