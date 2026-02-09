//Form.jsx
import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, method }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRole, setSelectedRole] = useState("ученик");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const name = method === "login" ? "Вход" : "Регистрация";
    const linkText = method === "login" ? "Войти" : "Зарегистрироваться";
    const linkTextTo = method === "login" ? "Зарегистрироваться" : "Войти";
    const linkPath = method === "login" ? "/register" : "/login";
    const linkQuestion = method === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        setError("");

        try {
            if (method === "login") {
                // проверка в бд
                const submissionData = { username, password, role: selectedRole };
                
                const res = await api.post(route, submissionData);

                const backendRole = res.data.role || "ученик";
                const selectedRoleForLogin = selectedRole;

                // сверяем роли с бд
                const roleMatches = 
                    (selectedRoleForLogin === "ученик" && (backendRole === "ученик" || backendRole === "student")) ||
                    (selectedRoleForLogin === "поваренок" && (backendRole === "поваренок" || backendRole === "cook")) ||
                    (selectedRoleForLogin === "администратор" && (backendRole === "администратор" || backendRole === "admin"));

                if (!roleMatches) {
                    setError("Неправильный логин или пароль");
                    localStorage.clear();
                    setLoading(false);
                    return;
                }

                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                localStorage.setItem("user_role", backendRole);
                
                const userData = {
                    id: res.data.user.id,
                    username: res.data.user.username,
                    role: res.data.user.role,
                    allergies: res.data.user.allergies || ""
                };
                localStorage.setItem("user", JSON.stringify(userData));

                // проверка роли в бд
                if (selectedRoleForLogin === "ученик") {
                    navigate("/");
                } else if (selectedRoleForLogin === "поваренок") {
                    navigate("/cook");
                } else if (selectedRoleForLogin === "администратор") {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
            } else {
                // всегда ученик
                const submissionData = { username, password };
                await api.post(route, submissionData);
                navigate("/login");
            }
        } catch (err) {
            if (method === "login") {
                setError("Неправильный логин или пароль");
            } else {
                setError("Произошла ошибка при регистрации.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>{name}</h1>
            <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Имя пользователя"
            />
            <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
            />

            {/* радиокнопки */}
            {method === "login" && (
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            value="ученик"
                            checked={selectedRole === "ученик"}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        />
                        Учащийся
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="поваренок"
                            checked={selectedRole === "поваренок"}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        />
                        Повар
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="администратор"
                            checked={selectedRole === "администратор"}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        />
                        Администратор
                    </label>
                </div>
            )}
            
            {method === "register" && (
                <div className="role-info">
                    <span style={{ color: 'red' }}>*только для учащихся</span>
                </div>
            )}

            {error && <p className="error-message">{error}</p>}

            {loading && <LoadingIndicator />}
            <button className="form-button" type="submit">
                {linkText}
            </button>
            
            <p>
                {linkQuestion} <Link to={linkPath}>{linkTextTo}</Link>
            </p>
        </form>
    );
}

export default Form;