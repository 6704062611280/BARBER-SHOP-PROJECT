import { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

export const DataContext = createContext();

export function DataProvider({ children }) {
    // --- Auth State ---
    const [role, setRole] = useState(null);
    const [islogin, setIsLogin] = useState(false);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("ชื่อผู้ใช้งาน");
    const [profileImg, setProfileImg] = useState("");
    const [userData, setUserData] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // --- Website Config State ---
    const [heroSlides, setHeroSlides] = useState([]);
    const [promoSlides, setPromoSlides] = useState([]);
    const [announcementText, setAnnouncementText] = useState("");

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    // 🚪 1. ฟังก์ชันออกจากระบบ
    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        setRole(null);
        setUserId(null);
        setIsLogin(false);
        setUserData(null);
        setUsername("ชื่อผู้ใช้งาน");
        setProfileImg("");
    }, []);

    // 🔄 2. ฟังก์ชันขอ Token ใหม่ (Refresh Token) - สำคัญ: ต้อง return access_token ออกมา
    const refreshToken = useCallback(async () => {
        const rfToken = localStorage.getItem("refresh_token");
        if (!rfToken) return null;

        try {
            const response = await fetch(`${baseURL}/auth/refresh?refresh_token=${rfToken}`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
                console.log("✅ Refresh Token Success");
                return data.access_token; // ส่ง token ใหม่กลับไปให้คนเรียกใช้งาน
            }
        } catch (err) {
            console.error("❌ Refresh token error:", err);
        }
        
        handleLogout(); 
        return null;
    }, [baseURL, handleLogout]);

    // 🛡️ 3. ฟังก์ชัน Fetch กลาง (แก้ปัญหา Loop 401)
    const fetchWithAuth = useCallback(async (url, options = {}) => {
        let token = localStorage.getItem("token");

        // สร้าง Header เริ่มต้น
        const getHeaders = (t) => ({
            "Content-Type": "application/json",
            ...options.headers,
            "Authorization": t ? `Bearer ${t}` : "",
        });

        // ยิง Request ครั้งแรก
        let response = await fetch(url, { 
            ...options, 
            headers: getHeaders(token) 
        });

        // 🔴 ถ้าเจอ 401 ให้พยายาม Refresh และยิงใหม่ทันที
        if (response.status === 401) {
            console.warn("⚠️ Token expired, retrying with new token...");
            const newToken = await refreshToken();

            if (newToken) {
                // ✅ ยิงซ้ำด้วย Token ใหม่ (Retry)
                response = await fetch(url, { 
                    ...options, 
                    headers: getHeaders(newToken) 
                });
            }
        }

        return response;
    }, [refreshToken]);

    // 🔄 4. ฟังก์ชันดึงข้อมูล Profile
    const fetchUserData = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setAuthLoading(false);
            return;
        }

        try {
            const response = await fetchWithAuth(`${baseURL}/auth/profile`);
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
            console.error("Fetch profile error:", err);
        } finally {
            setAuthLoading(false);
        }
    }, [baseURL, fetchWithAuth, handleLogout]);

    // 🔄 5. ดึงข้อมูลหน้าเว็บ (ดึงแบบ Public ไม่ผ่าน fetchWithAuth)
    const fetchWebsiteConfig = useCallback(async () => {
        try {
            const [imgRes, descRes] = await Promise.all([
                fetch(`${baseURL}/data_service/website/images`),
                fetch(`${baseURL}/data_service/website/description`),
            ]);

            if (imgRes.ok) {
                const imgData = await imgRes.json();
                setHeroSlides(imgData.BANNER || []);
                setPromoSlides(imgData.MAIN_IMG || []);
            }
            if (descRes.ok) {
                const descData = await descRes.json();
                setAnnouncementText(descData.massege || "");
            }
        } catch (err) {
            console.error("Public config error:", err);
        }
    }, [baseURL]);

    // 🛠 6. เช็คสถานะตอนโหลดแอปครั้งแรก
    useEffect(() => {
        fetchWebsiteConfig();
        
        const token = localStorage.getItem("token");
        const rfToken = localStorage.getItem("refresh_token");

        if (token) {
            fetchUserData();
        } else if (rfToken) {
            refreshToken().then(newToken => {
                if (newToken) fetchUserData();
                else setAuthLoading(false);
            });
        } else {
            setAuthLoading(false);
        }
    }, [fetchUserData, fetchWebsiteConfig, refreshToken]);

    return (
        <DataContext.Provider
            value={{
                role, setRole,
                userId, setUserId,
                islogin, setIsLogin,
                username, setUsername,
                profileImg, setProfileImg,
                userData,
                authLoading,
                fetchUserData,
                handleLogout,
                baseURL,
                fetchWithAuth, // ใช้ตัวนี้ในหน้าอื่นๆ แทน fetch ปกติ
                heroSlides, setHeroSlides,
                promoSlides, setPromoSlides,
                announcementText, setAnnouncementText,
                fetchWebsiteConfig,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}