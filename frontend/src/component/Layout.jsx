import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useContext, useState, useRef, useEffect } from "react"
import { DataContext } from "../DataContext"
import "./style/Layout.css" 

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // ดึงตัวแปรมาให้ครบจาก DataContext
  const { role, islogin, setIsLogin, setRole } = useContext(DataContext)
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const popupRef = useRef();

  const handleLogOut = () =>{
    setIsPopupOpen(false);
    localStorage.clear()
    localStorage.setItem("islogin", false)
    setIsLogin(false) 
    setRole(null) // ลบ Role ออกตอน Logout
    navigate("/login")
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsPopupOpen(false);
      }
    }
    if (isPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPopupOpen]);

  const navigateTo = (path) => {
    setIsPopupOpen(false);
    navigate(path);
  }

  const renderNavProfileIcon = () => {
    if (role === 'OWNER') return <span className="text-2xl">👨‍💼</span>;
    if (role === 'EMPLOYEE') return <span className="text-2xl">💈</span>;
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  }

  // อัปเดตลิงก์ย่อยให้ตรงกับ App.jsx
  const renderPopupMenuItems = () => {
    const menuItemClass = "flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 w-full text-left transition-colors duration-150";
    const commonMenu = <button onClick={() => navigateTo("/")} className={menuItemClass}>✏️ แก้ไขข้อมูลส่วนตัว</button>;

    if (role === 'CUSTOMER') {
      return <>{commonMenu}<button onClick={() => navigateTo("/booked-table")} className={menuItemClass}>📅 คิวของฉัน</button></>;
    }
    if (role === 'EMPLOYEE') {
      return <>{commonMenu}<button onClick={() => navigateTo("/working-table")} className={menuItemClass}>📋 จัดคิวลูกค้า</button></>;
    }
    if (role === 'OWNER') {
      return (
        <>
          {commonMenu}
          <button onClick={() => navigateTo("/dashboard")} className={menuItemClass}>📊 ภาพรวมกิจการ</button>
          <button onClick={() => navigateTo("/manage-user")} className={menuItemClass}>👥 จัดการพนักงาน</button>
        </>
      );
    }
    return commonMenu;
  }

  const getNavLinkClass = (path) => {
    return location.pathname === path ? "text-orange-600 font-extrabold" : "hover:text-orange-600 font-semibold transition-colors";
  }

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <header className="bg-[#f2d8b3] px-6 py-4 flex justify-between items-center shadow-sm relative z-40">
        <div className="flex items-center gap-2 font-bold text-2xl cursor-pointer" onClick={() => navigate("/")}>
          <span className="text-3xl">✂️</span> Barber shop
        </div>

        <nav className="hidden md:flex items-center gap-6 text-black">
          <button onClick={() => navigate("/")} className={getNavLinkClass("/")}>หน้าแรก</button>
          <span className="text-gray-400">|</span>
          <button onClick={() => navigate("/chair")} className={getNavLinkClass("/chair")}>จองคิว</button>
          
          {/* อัปเดต Path ให้เป็น /queues-table เพื่อให้ตรงกับ App.jsx */}
          {(!islogin || role === 'CUSTOMER') && (
            <>
              <span className="text-gray-400">|</span>
              <button onClick={() => navigate("/queues-table")} className={getNavLinkClass("/queues-table")}>สถานะคิว</button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4 relative">
          {!islogin && (
            <button onClick={() => navigate("/login")} className="bg-[#ff9c2f] hover:bg-[#ff8a00] text-black font-bold px-6 py-2 rounded-lg shadow-md border border-orange-400">
              ลงชื่อเข้าใช้
            </button>
          )}

          <div onClick={() => islogin && setIsPopupOpen(!isPopupOpen)} className={`w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 ${isPopupOpen ? 'border-orange-400' : 'border-transparent'} hover:border-orange-300 cursor-pointer shadow-sm overflow-hidden transition-all duration-150 relative z-50`}>
            {renderNavProfileIcon()}
          </div>

          {islogin && isPopupOpen && (
            <div ref={popupRef} className="absolute right-0 top-12 mt-2 w-64 bg-white rounded-2xl shadow-xl z-50 py-3 px-2 border border-gray-100 flex flex-col items-center">
              <div className="text-sm text-gray-500 mb-2 border-b w-full text-center pb-2">สถานะ: {role}</div>
              <div className="w-full flex flex-col items-start mb-2">{renderPopupMenuItems()}</div>
              <div className="w-full border-t border-gray-100 pt-2">
                <button onClick={handleLogOut} className="flex items-center px-4 py-2 w-full text-left text-sm text-red-600 font-semibold hover:bg-red-50 rounded-lg">
                   ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow bg-[#fffdf9]">
        <Outlet />
      </main>
      
      {/* --------------------------------------------------------- */}
      {/* 🛠️ DEV TOOLS: อัปเดตให้ setRole ทำงานแล้ว! */}
      <div className="fixed bottom-4 left-4 bg-white p-4 rounded-xl shadow-2xl border-2 border-red-500 z-[100] flex flex-col gap-2">
        <p className="text-xs font-bold text-red-500 text-center uppercase tracking-wider">Dev Tools : Switch Role</p>
        <div className="flex gap-2 text-sm">
          <button 
            onClick={() => { setIsLogin(false); setRole(null); }} 
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded font-bold"
          >
            Guest
          </button>
          <button 
            onClick={() => { setIsLogin(true); setRole('CUSTOMER'); }} 
            className="bg-blue-200 hover:bg-blue-300 px-3 py-1 rounded font-bold text-blue-800"
          >
            Customer
          </button>
          <button 
            onClick={() => { setIsLogin(true); setRole('EMPLOYEE'); }} 
            className="bg-green-200 hover:bg-green-300 px-3 py-1 rounded font-bold text-green-800"
          >
            Employee
          </button>
          <button 
            onClick={() => { setIsLogin(true); setRole('OWNER'); }} 
            className="bg-orange-200 hover:bg-orange-300 px-3 py-1 rounded font-bold text-orange-800"
          >
            Owner
          </button>
        </div>
      </div>
      {/* --------------------------------------------------------- */}

      <footer className="bg-[#5c4033] text-white py-10 px-8 md:px-24 flex flex-col md:flex-row justify-between items-start gap-8 z-30 relative">
        <div><h3 className="font-bold mb-3 text-lg">📍 ที่อยู่ร้าน</h3><p className="text-sm text-gray-200">120/8 หมู่บ้านร่มฟ้า วิลเลจ<br/>วรานคร 22310</p></div>
        <div><h3 className="font-bold mb-3 text-lg">ช่องทางติดต่อ</h3><p className="text-sm text-gray-200">💬 Barbershop123<br/>📞 020-123-4567</p></div>
        <div><h3 className="font-bold mb-3 text-lg">🕒 เปิดบริการทุกวัน</h3><p className="text-sm text-gray-200">10:00 น. - 20:00 น.</p></div>
      </footer>
    </div>
  )
}