import { Routes, Route, Router } from "react-router-dom"
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
import EditProfilePage from "./component/EditProfilePage"
import LeaveLetter from "./component/LeaveLetterPage"
import LeaveDetailPage from "./component/LeaveDetailPage"
import ChangePasswordPage from "./component/ChangePasswordPage"
import './App.css'
import { useState } from "react"
import Layout from "./component/Layout"

function App() {
  

  return (
    <>
   <Routes>
     <Route path="/test-manage-user" element={<ManageUser />} />
     <Route element={<Layout />}>
       <Route path="/" element={<Home />} />
       <Route path="/login" element={<Login />} />
       <Route path="/register" element={<Register />} />
       <Route path="/chair" element={<ChairPage/>}/>
       <Route path="/booked-table" element={<BookedTable/>}/>
       <Route path="/reset-password" element={<ResetPassword/>}/>
       <Route path="/edit-profile" element={<EditProfilePage/>}/>
       <Route path="/change-password" element={<ChangePasswordPage />} />
       <Route path="/queues-table" element={<QueueTable/>}/>
       <Route path="/notification" element={<Notification/>} />
       <Route path="/leave-letter" element={<LeaveLetter/>} />
       <Route path="/leave-detail" element={<LeaveDetailPage/>} />
       <Route element={<RequireRole allowRoles={["CUSTOMER"]} />}>
        </Route>
       <Route element={<RequireRole allowRoles={["EMPLOYEE"]} />}>
          <Route path="/working-table" element={<WorkTable/>}/>
        </Route>
        <Route element={<RequireRole allowRoles={["OWNER"]} />}>
          <Route path="/dashboard" element={<DashBoard/>} />
          <Route path="/manage-user" element={<ManageUser/>} />
        </Route>
     </Route>
    </Routes>
  

    </>
  )
}

export default App
