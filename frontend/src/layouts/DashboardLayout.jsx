import { lazy, Suspense, useEffect, useState } from "react";
import {
    Activity, BarChart3, Bell, Building2, CalendarDays, CircleDollarSign,
    Dumbbell, LayoutDashboard, LogOut, Menu, UserCheck, Users, WalletCards
} from "lucide-react";
import { api } from "../lib/api.js";
import Brand from "../components/common/Brand.jsx";
import ActionModal from "../components/forms/ActionModal.jsx";
const AdminDashboard = lazy(() => import("../pages/dashboards/AdminDashboard.jsx"));
const MemberDashboard = lazy(() => import("../pages/dashboards/MemberDashboard.jsx"));
const OwnerDashboard = lazy(() => import("../pages/dashboards/OwnerDashboard.jsx"));
const FeaturePage = lazy(() => import("../pages/FeaturePage.jsx"));

const iconMap = {
    dashboard: LayoutDashboard, gyms: Building2, members: Users, plans: Dumbbell,
    payments: CircleDollarSign, attendance: CalendarDays, trainers: UserCheck,
    reports: BarChart3, notifications: Bell, activity: Activity, wallet: WalletCards
};

export default function DashboardLayout({ user, onLogout }) {
    const [section, setSection] = useState("Dashboard");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modal, setModal] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const isAdmin = user.role === "SUPER_ADMIN";
    const isMember = user.role === "MEMBER";
    const nav = isAdmin
        ? [["Dashboard", "dashboard"], ["Gyms", "gyms"], ["Owners", "members"], ["Plans", "plans"], ["Analytics", "reports"], ["Activity Logs", "notifications"]]
        : isMember
            ? [["Dashboard", "dashboard"], ["My Profile", "members"], ["Membership", "plans"], ["Payments", "payments"], ["Attendance", "attendance"], ["Workout Plan", "gym"], ["Fitness Progress", "activity"], ["Notifications", "notifications"]]
            : [["Dashboard", "dashboard"], ["Members", "members"], ["Plans", "plans"], ["Payments", "payments"], ["Attendance", "attendance"], ["Trainers", "trainers"], ["Reports", "reports"], ["Announcements", "notifications"]];

    useEffect(() => {
        let active = true;
        const path = isAdmin ? "/api/v1/admin/dashboard"
            : isMember ? "/api/v1/member/dashboard"
                : "/api/v1/owner/dashboard";
        api(path)
            .then(result => {
                if (!active) return;
                setData(result);
                setError("");
            })
            .catch(requestError => {
                if (active) setError(requestError.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [user.role, isAdmin, isMember, refreshKey]);

    async function logout() {
        try {
            await api("/api/v1/auth/logout", { method: "POST" });
        } finally {
            localStorage.removeItem("gymflow_user");
            onLogout();
        }
    }

    const title = section === "Dashboard" ? "Overview" : section;
    return (
        <div className="app-shell">
            {mobileOpen && <div className="nav-overlay" onClick={() => setMobileOpen(false)} />}
            <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
                <Brand />
                <nav>
                    {nav.map(([label, icon]) => {
                        const Icon = iconMap[icon] || LayoutDashboard;
                        return (
                            <button key={label} className={section === label ? "active" : ""}
                                onClick={() => { setSection(label); setMobileOpen(false); }}>
                                <Icon size={18} /><span>{label}</span>
                            </button>
                        );
                    })}
                </nav>
                <button className="logout" onClick={logout}><LogOut size={18} /><span>Log out</span></button>
            </aside>
            <main className="workspace">
                <header className="topbar">
                    <button className="menu-button" onClick={() => setMobileOpen(value => !value)} aria-label="Open navigation"><Menu size={21} /></button>
                    <div className="breadcrumbs">GymFlow <span>/</span> {title}</div>
                    <div className="top-actions">
                        <button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button>
                        <div className="avatar">{isAdmin ? "SA" : isMember ? "MB" : "GO"}</div>
                    </div>
                </header>
                <div className="content">
                    {loading ? <div className="loading-state"><span /><span /><span /></div>
                        : error ? <div className="error-state"><strong>Unable to load workspace</strong><p>{error}</p><button className="secondary-button" onClick={() => { setLoading(true); setRefreshKey(value => value + 1); }}>Try again</button></div>
                            : <Suspense fallback={<div className="loading-row">Loading workspace...</div>}>
                                {section === "Dashboard"
                                    ? (isAdmin
                                    ? <AdminDashboard data={data} openModal={setModal} />
                                    : isMember
                                        ? <MemberDashboard data={data} openModal={setModal} />
                                        : <OwnerDashboard data={data} openModal={setModal} />)
                                    : <FeaturePage section={section} user={user} openModal={setModal} />}
                            </Suspense>}
                </div>
            </main>
            {modal && <ActionModal kind={modal} onClose={() => { setModal(null); setLoading(true); setRefreshKey(value => value + 1); }} />}
        </div>
    );
}
