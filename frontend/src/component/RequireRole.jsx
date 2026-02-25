import { Navigate, Outlet } from "react-router-dom"

export default function RequireRole({ allowRoles }) {
  const user = JSON.parse(localStorage.getItem("user"))

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}