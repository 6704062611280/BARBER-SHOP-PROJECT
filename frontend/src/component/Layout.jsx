import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useContext, useState, useRef, useEffect } from "react"
import { DataContext } from "../DataContext"
import "./style/Layout.css" 

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // เพิ่มการดึง username มาจาก DataContext (ถ้ายังไม่มีในระบบ จะใช้ค่าเริ่มต้นว่า "ชื่อผู้ใช้งาน" แทนไปก่อน)
  const { role, islogin, setIsLogin, setRole, username } = useContext(DataContext)
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const popupRef = useRef();

  const handleLogOut = () =>{
    setIsPopupOpen(false);
    localStorage.clear()
    localStorage.setItem("islogin", false)
    setIsLogin(false) 
    setRole(null) 
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

  // --- 1. จัดการรูปโปรไฟล์ (ก่อน Login ใช้ไอคอนเดิม, หลัง Login ใช้รูปตาม Role) ---
  const renderNavProfileIcon = () => {
    // ถ้ายังไม่ login ให้แสดงไอคอนเก่า (Guest)
    if (!islogin) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      );
    }

    // ถ้า Login แล้ว ให้แสดงตาม Role
    const currentRole = role ? role.toUpperCase() : '';
    if (currentRole === 'OWNER') return <img src="/images/icon-owner.png" alt="Owner Profile" className="w-full h-full object-cover" />;
    if (currentRole === 'EMPLOYEE') return <img src="/images/icon-employee.png" alt="Employee Profile" className="w-full h-full object-cover" />;
    if (currentRole === 'CUSTOMER') return <img src="/images/icon-customer.png" alt="Customer Profile" className="w-full h-full object-cover" />;
    
    // กรณีฉุกเฉินหา Role ไม่เจอ
    return <img src="/images/icon-customer.png" alt="Profile" className="w-full h-full object-cover" />;
  }

  // --- เมนู Popup ตาม Role ---
  const renderPopupMenuItems = () => {
    const menuItemClass = "flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 w-full text-left transition-colors duration-150 font-medium";
    const currentRole = role ? role.toUpperCase() : '';

    if (currentRole === 'CUSTOMER') {
      return (
        <>
          <button onClick={() => navigateTo("/edit-profile")} className={menuItemClass}>
             <img src="/images/icon-edit.png" alt="edit" className="w-5 h-5 mr-3" /> แก้ไขโปรไฟล์
          </button>
          <button onClick={() => navigateTo("/notification")} className={menuItemClass}>
             <img src="/images/icon-bell.png" alt="bell" className="w-5 h-5 mr-3" /> การแจ้งเตือน
          </button>
        </>
      );
    }
    
    if (currentRole === 'EMPLOYEE') {
      return (
        <>
          <button onClick={() => navigateTo("/edit-profile")} className={menuItemClass}>
             <img src="/images/icon-edit.png" alt="edit" className="w-5 h-5 mr-3" /> แก้ไขโปรไฟล์
          </button>
          <button onClick={() => navigateTo("/notification")} className={menuItemClass}>
             <img src="/images/icon-bell.png" alt="bell" className="w-5 h-5 mr-3" /> การแจ้งเตือน
          </button>
          <button onClick={() => navigateTo("/leave-letter")} className={menuItemClass}>
             <img src="/images/icon-leave.png" alt="leave" className="w-5 h-5 mr-3" /> แจ้งลา
          </button>
        </>
      );
    }

    if (currentRole === 'OWNER') {
      return (
        <>
          <button onClick={() => navigateTo("/edit-profile")} className={menuItemClass}>
             <img src="/images/icon-edit.png" alt="edit" className="w-5 h-5 mr-3" /> แก้ไขโปรไฟล์
          </button>
          <button onClick={() => navigateTo("/notification")} className={menuItemClass}>
             <img src="/images/icon-bell.png" alt="bell" className="w-5 h-5 mr-3" /> การแจ้งเตือน
          </button>
          <button onClick={() => navigateTo("/dashboard")} className={menuItemClass}>
             <img src="/images/icon-chart.png" alt="chart" className="w-5 h-5 mr-3" /> ดูกราฟผลประกอบการ
          </button>
          <button onClick={() => navigateTo("/manage-user")} className={menuItemClass}>
             <img src="/images/icon-users.png" alt="users" className="w-5 h-5 mr-3" /> จัดการบัญชีสมาชิก
          </button>
          <button onClick={() => navigateTo("/custom-web")} className={menuItemClass}>
             <img src="/images/icon-web.png" alt="web" className="w-5 h-5 mr-3" /> ปรับแต่งเว็บไซด์
          </button>
          <button onClick={() => navigateTo("/shop-setting")} className={menuItemClass}>
             <img src="/images/icon-setting.png" alt="setting" className="w-5 h-5 mr-3" /> จัดการคิว & สถานะร้าน
          </button>
        </>
      );
    }
    
    return null;
  }

  // สไตล์เมนู Navbar (สีส้มเมื่อ Active แต่ไม่เปลี่ยนขนาด)
  const navLinkClass = "text-black hover:text-[#ff9c2f] font-semibold transition-colors cursor-pointer";
  const activeNavLinkClass = "text-[#ff9c2f] font-semibold transition-colors cursor-pointer";

  const getLinkStyle = (path) => {
    return location.pathname === path ? activeNavLinkClass : navLinkClass;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      
      {/* --- Navbar --- */}
      <header className="bg-[#F6DBB8] px-6 py-4 flex flex-row justify-between items-center shadow-sm relative z-50 h-20">
        
        {/* ส่วนที่ 1: โลโก้ */}
        <div className="flex-1 flex justify-start items-center">
          <div className="cursor-pointer" onClick={() => navigate("/")}>
             <img src="/images/logo-barber.png" alt="Barber Shop Logo" className="h-12 w-auto object-contain" />
          </div>
        </div>

        {/* ส่วนที่ 2: เมนูตรงกลาง */}
        <nav className="flex-1 hidden md:flex justify-center items-center gap-6">
          <button onClick={() => navigate("/")} className={getLinkStyle("/")}>หน้าแรก</button>
          <span className="text-gray-400 font-light">|</span>
          <button onClick={() => navigate("/chair")} className={getLinkStyle("/chair")}>จองคิว</button>
          
          {(!islogin || (role && role.toUpperCase() === 'CUSTOMER')) && (
            <>
              <span className="text-gray-400 font-light">|</span>
              <button onClick={() => navigate("/queues-table")} className={getLinkStyle("/queues-table")}>สถานะคิว</button>
            </>
          )}
        </nav>

        {/* ส่วนที่ 3: ปุ่ม Login / Profile Popup */}
        <div className="flex-1 flex justify-end items-center gap-4 relative">
          {!islogin && (
            <button onClick={() => navigate("/login")} className="bg-[#FFA333] hover:bg-[#ff8a00] text-black font-bold px-6 py-2 rounded-lg shadow-md border border-orange-400 transition-colors">
              ลงชื่อเข้าใช้
            </button>
          )}

          <div onClick={() => islogin && setIsPopupOpen(!isPopupOpen)} className={`w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 ${isPopupOpen ? 'border-orange-400' : 'border-transparent'} hover:border-orange-300 cursor-pointer shadow-sm overflow-hidden transition-all duration-150`}>
            {renderNavProfileIcon()}
          </div>

          {/* Popup Menu */}
          {islogin && isPopupOpen && (
            <div ref={popupRef} className="absolute right-0 top-14 mt-2 w-72 bg-white rounded-2xl shadow-xl py-3 border border-gray-100 flex flex-col z-50">
              <div className="flex items-center gap-3 px-5 pb-3 border-b border-gray-100 mb-2">
                 <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    {renderNavProfileIcon()}
                 </div>
                 <div className="flex flex-col text-left">
                    {/* 2. เปลี่ยนคำว่าเป็นชื่อบัญชี username (ดึงจาก DataContext) */}
                    <span className="font-bold text-gray-800">{username || "ชื่อผู้ใช้งาน"}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{role}</span>
                 </div>
              </div>
              
              <div className="w-full flex flex-col items-start mb-2">
                {renderPopupMenuItems()}
              </div>

              <div className="w-full border-t border-gray-100 pt-2 px-2">
                <button onClick={handleLogOut} className="flex items-center px-4 py-2 w-full text-left text-sm text-red-600 font-bold hover:bg-red-50 rounded-lg">
                   <img src="/images/icon-logout.png" alt="logout" className="w-5 h-5 mr-3" /> ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-grow bg-[#fffdf9]">
        <Outlet />
      </main>
      
      {/* --- Footer (เอาโครงสร้างจาก Layout เก่า แต่ใส่ Icon รูปภาพแทน) --- */}
      <footer className="bg-[#5D4037] text-white py-10 px-8 md:px-24 flex flex-col md:flex-row justify-between items-start gap-8 z-30 relative">
        <div>
          <h3 className="font-bold mb-3 text-lg flex items-center gap-2">
             <img src="/images/icon-location-white.png" alt="location" className="w-6 h-6 object-contain" /> ที่อยู่ร้าน
          </h3>
          <p className="text-sm text-gray-200">120/8 หมู่บ้านร่มฟ้า วิลเลจ<br/>วรานคร 22310</p>
        </div>

        <div>
          <h3 className="font-bold mb-3 text-lg">ช่องทางติดต่อ</h3>
          <p className="text-sm text-gray-200 flex items-center gap-2 mb-1">
             <img src="/images/icon-chat-white.png" alt="chat" className="w-5 h-5 object-contain" /> Barbershop123
          </p>
          <p className="text-sm text-gray-200 flex items-center gap-2">
             <img src="/images/icon-phone-white.png" alt="phone" className="w-5 h-5 object-contain" /> 020-123-4567
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-3 text-lg flex items-center gap-2">
             <img src="/images/icon-clock-white.png" alt="clock" className="w-6 h-6 object-contain" /> เปิดบริการทุกวัน
          </h3>
          <p className="text-xl text-gray-200">10:00 น. - 20:00 น.</p>
        </div>
      </footer>
    </div>
  )
}