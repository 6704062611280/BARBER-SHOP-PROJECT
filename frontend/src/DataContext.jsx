import { createContext, useState, useEffect } from "react"
import { jwtDecode } from "jwt-decode"

export const DataContext = createContext()

export function DataProvider({ children }) {
  const [role, setRole] = useState(null)
  const [islogin, setIsLogin] = useState(false)
  const [userId, setUserId] = useState(null)
  const [username, setUsername] = useState("ชื่อผู้ใช้งาน")

  // =========================================================
  // 🌟 เพิ่ม State สำหรับระบบ Custom Web Page (Owner) ตรงนี้
  // ตั้งค่า Default รูปภาพให้เป็น 1 รูป ตามที่คุณต้องการ
  // =========================================================
  const [heroSlides, setHeroSlides] = useState(["/images/slide1.jpg"]);
  const [promoSlides, setPromoSlides] = useState(["/images/slide2.jpg"]);
  const [announcementText, setAnnouncementText] = useState("ใส่ข้อมูลร้านตรงนี้...");

  useEffect(()=>{
    const token = localStorage.getItem("token")
    if(token){
         try {
             const decoded = jwtDecode(token)
             setRole(decoded.role)
             setUserId(decoded.user_id)
             if(decoded.username) setUsername(decoded.username)
             setIsLogin(true)
         } catch(e) {
             console.error("Invalid token")
         }
    }
  },[])

  return (
    <DataContext.Provider value={{  
        role, userId, islogin, setRole, setIsLogin, username, setUsername,
        
        // อย่าลืมส่งตัวแปรและฟังก์ชันสำหรับตั้งค่าเว็บออกไปให้ไฟล์อื่นใช้ด้วย!
        heroSlides, setHeroSlides,
        promoSlides, setPromoSlides,
        announcementText, setAnnouncementText
    }}>
        {children}
    </DataContext.Provider>
  )
}