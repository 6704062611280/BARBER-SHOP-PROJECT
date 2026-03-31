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

  // State สำหรับจัดการคิวของลูกค้า
  const [bookedQueues, setBookedQueues] = useState([
      // ตัวอย่างข้อมูลจำลอง (Mock Data) ถ้าไม่อยากให้มีคิวเลย ก็ลบข้างในให้เหลือแค่ [] ได้ครับ
      { id: 1, code: "Q-001", time: "10:00 - 11:00", date: "12 ต.ค. 2026" }
  ]);

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
        heroSlides, setHeroSlides,
        promoSlides, setPromoSlides,
        announcementText, setAnnouncementText,
        
        // 🌟 ส่งตัวแปรคิวออกไปให้ ViewBookedPage ใช้งาน
        bookedQueues, setBookedQueues
    }}>
        {children}
    </DataContext.Provider>
  )
}