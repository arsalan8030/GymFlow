import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import { api } from "./lib/api.js";
import LoginPage from "./components/auth/LoginPage.jsx";
import ActivateAccountPage from "./components/auth/ActivateAccountPage.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

function getSavedUser() {
    try { return JSON.parse(localStorage.getItem("gymflow_user")); } catch { return null; }
}

function ApplicationRoutes() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getSavedUser);
    const [checkingSession, setCheckingSession] = useState(() => Boolean(getSavedUser()));
    const userId = user?.id;

    useEffect(() => {
        if (!userId) return;
        let active = true;
        api("/api/v1/auth/session")
            .then(data => {
                if (!active) return;
                setUser(data.user);
                if (data.user) localStorage.setItem("gymflow_user", JSON.stringify(data.user));
                else localStorage.removeItem("gymflow_user");
            })
            .catch(() => {
                if (!active) return;
                localStorage.removeItem("gymflow_user");
                setUser(null);
            })
            .finally(() => { if (active) setCheckingSession(false); });
        return () => { active = false; };
    }, [userId]);

    return (
        checkingSession ? <main className="login-page"><div className="loading-state"><span /><span /><span /></div></main> :
        <Routes>
            <Route path="/activate" element={<ActivateAccountPage onActivated={() => navigate("/login")} />} />
            <Route path="/login" element={user
                ? <Navigate to="/" replace />
                : <LoginPage onLogin={setUser} />} />
            <Route path="/" element={user
                ? <DashboardLayout user={user} onLogout={() => setUser(null)} />
                : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return <BrowserRouter><ApplicationRoutes /></BrowserRouter>;
}
