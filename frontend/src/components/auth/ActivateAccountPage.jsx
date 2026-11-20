import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import Brand from "../common/Brand.jsx";

export default function ActivateAccountPage({ onActivated }) {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");
    const [complete, setComplete] = useState(false);
    const [loading, setLoading] = useState(false);
    const token = searchParams.get("token");

    async function submit(event) {
        event.preventDefault();
        setError("");
        if (!token) return setError("Activation link is missing its token");
        if (password !== confirmation) return setError("Passwords do not match");
        setLoading(true);
        try {
            await api("/api/v1/auth/activate-member", {
                method: "POST",
                body: JSON.stringify({ token, password })
            });
            setComplete(true);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-right activation-page">
                <div className="login-card">
                    <div className="login-mobile-brand"><Brand /></div>
                    <h2>{complete ? "Account activated" : "Activate your account"}</h2>
                    <p>{complete ? "Your password is ready. Sign in to GymFlow." : "Create a strong password to finish setup."}</p>
                    {error && <div className="error-banner">{error}</div>}
                    {complete ? <button className="primary-button" onClick={onActivated}>Continue to sign in</button> : (
                        <form className="activation-form" onSubmit={submit}>
                            <label><span>Password (at least 12 characters)</span><input type="password" minLength="12" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
                            <label><span>Confirm password</span><input type="password" minLength="12" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
                            <button className="primary-button" disabled={loading}>{loading ? "Activating..." : "Set password"}</button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}
