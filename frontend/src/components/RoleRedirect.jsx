import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";

function RoleRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const role = decoded.role || localStorage.getItem("user_role") || "student";
                
                switch(role) {
                    case "admin":
                        navigate("/admin");
                        break;
                    case "cook":
                        navigate("/cook");
                        break;
                    case "student":
                    default:
                        navigate("/");
                        break;
                }
            } catch (error) {
                navigate("/login");
            }
        } else {
            navigate("/login");
        }
    }, [navigate]);

    return <div>Перенаправление...</div>;
}

export default RoleRedirect;