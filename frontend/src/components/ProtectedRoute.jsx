import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";

function ProtectedRoute({ children, allowedRoles = [] }) {
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        auth().catch(() => setIsAuthorized(false))
    }, [])

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        try {
            const res = await api.post("/api/token/refresh/", {
                refresh: refreshToken,
            });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);
                // После обновления токена получаем роль
                getUserRole();
            } else {
                setIsAuthorized(false);
            }
        } catch (error) {
            console.log(error);
            setIsAuthorized(false);
        }
    };

    const getUserRole = () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Предполагаем, что роль хранится в токене или localStorage
                const role = decoded.role || localStorage.getItem("user_role") || "student";
                setUserRole(role);
                return role;
            } catch (error) {
                console.error("Error decoding token:", error);
                return "student";
            }
        }
        return "student";
    };

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAuthorized(false);
            return;
        }
        
        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
            await refreshToken();
        } else {
            setIsAuthorized(true);
            // Получаем роль пользователя
            const role = getUserRole();
            setUserRole(role);
        }
    };

    // Проверка доступа по роли
    const checkRoleAccess = () => {
        if (allowedRoles.length === 0) {
            return true; // Если роли не указаны, доступ разрешен всем авторизованным
        }
        
        if (!userRole) {
            return false;
        }
        
        return allowedRoles.includes(userRole);
    };

    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    if (!isAuthorized) {
        return <Navigate to="/login" />;
    }

    if (!checkRoleAccess()) {
        // Перенаправляем на страницу по умолчанию для роли
        switch(userRole) {
            case "admin":
                return <Navigate to="/admin" />;
            case "cook":
                return <Navigate to="/cook" />;
            case "student":
            default:
                return <Navigate to="/" />;
        }
    }

    return children;
}

export default ProtectedRoute;