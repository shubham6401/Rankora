import { Navigate } from "react-router-dom";
export default function ProtectedRoutes({children}){
    let token=localStorage.getItem("token");
    if(!token){
        return <Navigate to="/login-user" replace />;
    }
    return children;

}