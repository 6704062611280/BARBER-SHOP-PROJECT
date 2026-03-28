import { Routes, Route } from "react-router-dom"
import Home from './component/Home' 
import Login from './component/LoginPage' 
import ChairPage from "./component/SelectChairPage"
import Register from "./component/RegisterPage"
import BookedTable from "./component/ViewBookedPage"
import ManageUser from "./component/ManageUser"
import RequireRole from "./component/RequireRole"
import DashBoard from "./component/DashBoardPage"
import ResetPassword from "./component/ResetPasswordPage"
import WorkTable from "./component/WorkTablePage"
import QueueTable from "./component/QueuesPage"
import Shopsetting from "./component/ShopSetting"
import CustomWeb from "./component/CustomWebPage"
import Notification from "./component/NotificationPage"
import EditProfile from "./component/EditProfilePage" // <-- นำเข้าหน้า Edit Profile
import LeaveLetter from "./component/LeaveLetterPage" // <-- นำเข้าหน้า Leave Letter
import './App.css'
import Layout from "./component/Layout"

function App() {
  return (
    <>
      <Routes>
        {/* ทุกหน้าเว็บที่อยู่ภายใต้ <Route element={<Layout />}> จะมี Navbar และ Footer โชว์เสมอ */}
        <Route element={<Layout />}>
          
          {/* --- หน้าที่ทุกคนเข้าถึงได้ (Guest) --- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chair" element={<ChairPage/>}/>
          <Route path="/reset-password" element={<ResetPassword/>}/>
          <Route path="/queues-table" element={<QueueTable/>}/>

          {/* --- หน้าที่ต้อง Login เข้ามาก่อนถึงจะเห็น --- */}
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/notification" element={<Notification />} />

          {/* --- หน้าเฉพาะ Role: CUSTOMER --- */}
          <Route element={<RequireRole allowRoles={["CUSTOMER"]} />}>
            <Route path="/booked-table" element={<BookedTable/>}/>
          </Route>

          {/* --- หน้าเฉพาะ Role: EMPLOYEE --- */}
          <Route element={<RequireRole allowRoles={["EMPLOYEE"]} />}>
            <Route path="/working-table" element={<WorkTable/>}/>
            <Route path="/leave-letter" element={<LeaveLetter/>}/>
          </Route>

          {/* --- หน้าเฉพาะ Role: OWNER --- */}
          <Route element={<RequireRole allowRoles={["OWNER"]} />}>
            <Route path="/dashboard" element={<DashBoard/>} />
            <Route path="/manage-user" element={<ManageUser />} />
            
            {/* 🌟 เพิ่ม Route 2 หน้านี้ให้แล้วครับ! 🌟 */}
            <Route path="/custom-web" element={<CustomWeb />} />
            <Route path="/shop-setting" element={<Shopsetting />} />
          </Route>

        </Route>
      </Routes>
    </>
  )
}

export default App