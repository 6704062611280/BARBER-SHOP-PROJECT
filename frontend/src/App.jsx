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
import WorkingTable from "./component/workingTablePage"
import Queues from "./component/QueuesPage"
import './App.css'
import { useState } from "react"
import Layout from "./component/Layout"

function App() {
  

  return (
    <>
   <Routes>
     <Route element={<Layout />}>
       <Route path="/" element={<Home />} />
       <Route path="/login" element={<Login />} />
       <Route path="/register" element={<Register />} />
       <Route path="/chair" element={<ChairPage/>}/>
       <Route path="/booked-table" element={<BookedTable/>}/>
       <Route path="/reset-password" element={<ResetPassword/>}/>
       <Router path="/working-table" element={<WorkingTable/>}/>
       <Router path="/queues-table" element={<Queues/>}/>
       <Route element={<RequireRole allowRoles={["employee"]} />}>
          <Route path="/dashboard" element={<DashBoard/>} />
          <Route path="/manage-user" element={<ManageUser />} />
        </Route>
     </Route>
    </Routes>
  

    </>
  )
}

export default App
