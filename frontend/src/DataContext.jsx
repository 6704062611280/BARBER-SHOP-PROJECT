import { createContext, useState, useEffect } from "react"

export const DataContext = createContext()

export function DataProvider({ children }) {
  const [id, setId] = useState(null)
  const [role, setRole] = useState(null)
  const [islogin,setIsLogin] = useState(false)
  useEffect(()=>{
    const storedId = localStorage.getItem("id")
    const storedRole = localStorage.getItem("role")
    if(storedId && storedRole){
        setId(storedId)
        setRole(storedRole)
        setIsLogin(true)
    }
  },[])

  return (
    <DataContext.Provider value={{ id, setId, role, setRole, islogin, setIsLogin }}>
        {children}
    </DataContext.Provider>
  )
}