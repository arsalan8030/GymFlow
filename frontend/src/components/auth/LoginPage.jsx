import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { api } from "../../lib/api.js";
import Brand from "../common/Brand.jsx";

export default function LoginPage({ onLogin }) {
    const [role, setRole] = useState("owner");
    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function submit(event) {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const data = await api(`/api/v1/auth/${role}/login`, {
                method: "POST",
                body: JSON.stringify(role === "member"
                    ? { memberId: loginId, password }
                    : { email: loginId, password })
            });
            localStorage.setItem("gymflow_user", JSON.stringify(data.user));
            onLogin(data.user);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-left">
                <Brand />
                <div className="login-copy">
                    <div className="eyebrow"><span /> Gym management, reimagined</div>
                    <h1>Run your gym.<br /><em>Own your growth.</em></h1>
                    <p>Members, payments, attendance and performance—everything working together in one powerful workspace.</p>
                    <div className="login-stats">
                        <div><strong>12k+</strong><span>Members managed</span></div>
                        <div><strong>98%</strong><span>Payment on-time</span></div>
                        <div><strong>24/7</strong><span>Member access</span></div>
                    </div>
                </div>
            </section>
            <section className="login-right">
                <form className="login-card" onSubmit={submit}>
                    <div className="login-mobile-brand"><Brand /></div>
                    <h2>Welcome back</h2>
                    <p>Sign in to your GymFlow workspace</p>
                    <div className="role-tabs" aria-label="Login role">
                        {[["owner", "Gym Owner"], ["member", "Member"], ["admin", "Super Admin"]].map(([value, label]) => (
                            <button type="button" className={role === value ? "active" : ""} onClick={() => setRole(value)} key={value}>
                                {label}
                            </button>
                        ))}
                    </div>
                    {error && <div className="error-banner">{error}</div>}
                    <label>
                        <span>{role === "member" ? "Member ID" : "Email address"}</span>
                        <input value={loginId} onChange={event => setLoginId(event.target.value)} placeholder={role === "member" ? "MF-000000" : "name@gym.com"} required />
                    </label>
                    <label>
                        <span>Password</span>
                        <div className="password-field">
                            <input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" required />
                            <button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? "Hide" : "Show"}</button>
                        </div>
                    </label>
                    <button className="primary-button" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"} {!loading && <ArrowRight size={17} />}
                    </button>
                </form>
            </section>
        </main>
    );
}
