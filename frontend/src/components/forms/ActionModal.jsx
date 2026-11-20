import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import Modal from "../common/Modal.jsx";

export default function ActionModal({ kind, onClose }) {
    const [form, setForm] = useState({});
    const [options, setOptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [activationUrl, setActivationUrl] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        if (kind === "payment" || kind === "attendance") {
            api("/api/v1/owner/members").then(data => {
                if (active) setOptions(data.members || []);
            }).catch(requestError => {
                if (active) setError(requestError.message);
            });
        }
        if (kind === "member") {
            api("/api/v1/owner/memberships").then(data => {
                if (active) setPlans(data.plans || []);
            }).catch(requestError => {
                if (active) setError(requestError.message);
            });
        }
        return () => { active = false; };
    }, [kind]);

    const set = (name, value) => setForm(current => ({ ...current, [name]: value }));

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            let result = {};
            if (kind === "gym") {
                result = await api("/api/v1/admin/gyms", { method: "POST", body: JSON.stringify({
                    gymName: form.gymName, ownerName: form.ownerName, ownerEmail: form.ownerEmail,
                    ownerPhone: form.ownerPhone, gymPhone: form.gymPhone, gymEmail: form.gymEmail,
                    address: form.address, city: form.city, state: form.state, pinCode: form.pinCode,
                    planName: form.planName, startDate: form.startDate, expiryDate: form.expiryDate
                }) });
            } else if (kind === "platformPlan") {
                result = await api("/api/v1/admin/plans", { method: "POST", body: JSON.stringify({
                    name: form.name, monthlyPrice: form.monthlyPrice, yearlyPrice: form.yearlyPrice,
                    maxMembers: form.maxMembers,
                    features: String(form.features || "").split(",").map(feature => feature.trim()).filter(Boolean)
                }) });
            } else if (kind === "member") {
                result = await api("/api/v1/owner/members", { method: "POST", body: JSON.stringify({
                    fullName: form.fullName, phone: form.phone, email: form.email,
                    joiningDate: form.joiningDate, membershipFee: form.membershipFee,
                    discount: form.discount, initialPayment: form.initialPayment,
                    paymentMethod: form.paymentMethod, durationDays: form.durationDays,
                    planId: form.planId, notes: form.notes
                }) });
            } else if (kind === "plan") {
                result = await api("/api/v1/owner/memberships", { method: "POST", body: JSON.stringify({
                    name: form.name, durationDays: form.durationDays, price: form.price,
                    description: form.description, benefits: form.benefits
                }) });
            } else if (kind === "payment") {
                result = await api("/api/v1/owner/payments", { method: "POST", body: JSON.stringify({
                    memberId: form.memberId, amount: form.amount, paymentMethod: form.paymentMethod,
                    referenceNumber: form.referenceNumber, paymentDate: form.paymentDate, notes: form.notes
                }) });
            } else if (kind === "attendance") {
                result = await api("/api/v1/owner/attendance", { method: "POST", body: JSON.stringify({
                    memberId: form.memberId, date: form.date, status: form.status || "PRESENT",
                    checkInTime: form.checkInTime
                }) });
            } else if (kind === "trainer") {
                result = await api("/api/v1/owner/trainers", { method: "POST", body: JSON.stringify({
                    name: form.name, phone: form.phone, email: form.email, specialization: form.specialization
                }) });
            } else if (kind === "announcement") {
                result = await api("/api/v1/owner/announcements", { method: "POST", body: JSON.stringify({
                    title: form.title, message: form.message, expiryDate: form.expiryDate
                }) });
            } else if (kind === "weight") {
                result = await api("/api/v1/member/progress", { method: "POST", body: JSON.stringify({
                    weightKg: form.weightKg, date: form.date, notes: form.notes
                }) });
            }

            const token = result.ownerActivationToken || result.activationToken;
            if (token) {
                setActivationUrl(`${window.location.origin}/activate?token=${encodeURIComponent(token)}`);
                setSuccess("Account created. Copy this one-time activation link and share it securely.");
            } else {
                setSuccess("Saved successfully");
                window.setTimeout(onClose, 700);
            }
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    }

    const title = kind === "gym" ? "Create gym"
        : kind === "platformPlan" ? "Create platform plan"
        : kind === "member" ? "Add member"
            : kind === "plan" ? "Create membership plan"
                : kind === "payment" ? "Record payment"
                    : kind === "attendance" ? "Mark attendance"
                        : kind === "trainer" ? "Add trainer"
                            : kind === "announcement" ? "Create announcement"
                                : "Log weight";

    return (
        <Modal title={title} onClose={onClose}>
            <form className="action-form" onSubmit={submit}>
                {error && <div className="error-banner">{error}</div>}
                {success && <div className="success-banner">{success}</div>}
                {activationUrl && <div className="activation-link">
                    <input readOnly value={activationUrl} aria-label="One-time activation link" />
                    <button type="button" className="secondary-button" onClick={() => navigator.clipboard.writeText(activationUrl)}>Copy link</button>
                </div>}
                {kind === "gym" && <div className="form-grid">
                    <label><span>Gym name *</span><input required value={form.gymName || ""} onChange={event => set("gymName", event.target.value)} /></label>
                    <label><span>Owner name *</span><input required value={form.ownerName || ""} onChange={event => set("ownerName", event.target.value)} /></label>
                    <label><span>Owner email *</span><input required type="email" value={form.ownerEmail || ""} onChange={event => set("ownerEmail", event.target.value)} /></label>
                    <label><span>Owner phone</span><input value={form.ownerPhone || ""} onChange={event => set("ownerPhone", event.target.value)} /></label>
                    <label><span>Gym phone</span><input value={form.gymPhone || ""} onChange={event => set("gymPhone", event.target.value)} /></label>
                    <label><span>Gym email</span><input type="email" value={form.gymEmail || ""} onChange={event => set("gymEmail", event.target.value)} /></label>
                    <label className="wide"><span>Address</span><input value={form.address || ""} onChange={event => set("address", event.target.value)} /></label>
                    <label><span>City</span><input value={form.city || ""} onChange={event => set("city", event.target.value)} /></label>
                    <label><span>State</span><input value={form.state || ""} onChange={event => set("state", event.target.value)} /></label>
                    <label><span>PIN code</span><input value={form.pinCode || ""} onChange={event => set("pinCode", event.target.value)} /></label>
                    <label><span>Subscription plan</span><input value={form.planName || ""} onChange={event => set("planName", event.target.value)} /></label>
                </div>}
                {kind === "platformPlan" && <div className="form-grid">
                    <label><span>Plan name *</span><input required value={form.name || ""} onChange={event => set("name", event.target.value)} /></label>
                    <label><span>Maximum members *</span><input required type="number" min="1" value={form.maxMembers || ""} onChange={event => set("maxMembers", event.target.value)} /></label>
                    <label><span>Monthly price *</span><input required type="number" min="0" value={form.monthlyPrice || ""} onChange={event => set("monthlyPrice", event.target.value)} /></label>
                    <label><span>Yearly price *</span><input required type="number" min="0" value={form.yearlyPrice || ""} onChange={event => set("yearlyPrice", event.target.value)} /></label>
                    <label className="wide"><span>Features (comma separated)</span><textarea value={form.features || ""} onChange={event => set("features", event.target.value)} /></label>
                </div>}
                {kind === "member" && <div className="form-grid">
                    <label><span>Full name *</span><input required value={form.fullName || ""} onChange={event => set("fullName", event.target.value)} /></label>
                    <label><span>Phone *</span><input required value={form.phone || ""} onChange={event => set("phone", event.target.value)} /></label>
                    <label><span>Email</span><input type="email" value={form.email || ""} onChange={event => set("email", event.target.value)} /></label>
                    <label><span>Joining date</span><input type="date" value={form.joiningDate || ""} onChange={event => set("joiningDate", event.target.value)} /></label>
                    <label><span>Membership plan</span><select value={form.planId || ""} onChange={event => {
                        const plan = plans.find(item => item.id === event.target.value);
                        setForm(current => ({ ...current, planId: event.target.value, membershipFee: plan?.price ?? current.membershipFee, durationDays: plan?.duration_days ?? current.durationDays }));
                    }}><option value="">Custom duration and fee</option>{plans.map(plan => <option value={plan.id} key={plan.id}>{plan.name} · ₹{plan.price}</option>)}</select></label>
                    <label><span>Duration (days)</span><input type="number" min="1" value={form.durationDays || ""} onChange={event => set("durationDays", event.target.value)} /></label>
                    <label><span>Membership fee</span><input type="number" min="0" value={form.membershipFee || ""} onChange={event => set("membershipFee", event.target.value)} /></label>
                    <label><span>Discount</span><input type="number" min="0" value={form.discount || ""} onChange={event => set("discount", event.target.value)} /></label>
                    <label><span>Initial payment</span><input type="number" min="0" value={form.initialPayment || ""} onChange={event => set("initialPayment", event.target.value)} /></label>
                    <label className="wide"><span>Notes</span><textarea value={form.notes || ""} onChange={event => set("notes", event.target.value)} /></label>
                </div>}
                {kind === "plan" && <div className="form-grid">
                    <label><span>Plan name *</span><input required value={form.name || ""} onChange={event => set("name", event.target.value)} /></label>
                    <label><span>Duration (days) *</span><input required type="number" min="1" value={form.durationDays || ""} onChange={event => set("durationDays", event.target.value)} /></label>
                    <label><span>Price *</span><input required type="number" min="0" value={form.price || ""} onChange={event => set("price", event.target.value)} /></label>
                    <label className="wide"><span>Description</span><textarea value={form.description || ""} onChange={event => set("description", event.target.value)} /></label>
                </div>}
                {(kind === "payment" || kind === "attendance") && <div className="form-grid">
                    <label><span>Member *</span><select required value={form.memberId || ""} onChange={event => set("memberId", event.target.value)}>
                        <option value="">Select member</option>{options.map(member => <option value={member.id} key={member.id}>{member.full_name} — {member.member_id}</option>)}
                    </select></label>
                    {kind === "payment" ? <>
                        <label><span>Amount *</span><input required type="number" min="1" value={form.amount || ""} onChange={event => set("amount", event.target.value)} /></label>
                        <label><span>Payment method</span><select value={form.paymentMethod || "CASH"} onChange={event => set("paymentMethod", event.target.value)}>
                            <option>CASH</option><option>UPI</option><option>BANK_TRANSFER</option><option>CARD</option><option>OTHER</option>
                        </select></label>
                        <label><span>Reference</span><input value={form.referenceNumber || ""} onChange={event => set("referenceNumber", event.target.value)} /></label>
                        <label className="wide"><span>Notes</span><textarea value={form.notes || ""} onChange={event => set("notes", event.target.value)} /></label>
                    </> : <>
                        <label><span>Date</span><input type="date" value={form.date || ""} onChange={event => set("date", event.target.value)} /></label>
                        <label><span>Status</span><select value={form.status || "PRESENT"} onChange={event => set("status", event.target.value)}><option>PRESENT</option><option>ABSENT</option></select></label>
                    </>}
                </div>}
                {kind === "trainer" && <div className="form-grid">
                    <label><span>Name *</span><input required value={form.name || ""} onChange={event => set("name", event.target.value)} /></label>
                    <label><span>Phone</span><input value={form.phone || ""} onChange={event => set("phone", event.target.value)} /></label>
                    <label><span>Email</span><input type="email" value={form.email || ""} onChange={event => set("email", event.target.value)} /></label>
                    <label><span>Specialization</span><input value={form.specialization || ""} onChange={event => set("specialization", event.target.value)} /></label>
                </div>}
                {kind === "announcement" && <div className="form-grid">
                    <label className="wide"><span>Title *</span><input required value={form.title || ""} onChange={event => set("title", event.target.value)} /></label>
                    <label className="wide"><span>Message *</span><textarea required value={form.message || ""} onChange={event => set("message", event.target.value)} /></label>
                    <label><span>Expiry date</span><input type="date" value={form.expiryDate || ""} onChange={event => set("expiryDate", event.target.value)} /></label>
                </div>}
                {kind === "weight" && <div className="form-grid">
                    <label><span>Weight (kg) *</span><input required type="number" min="1" step="0.1" value={form.weightKg || ""} onChange={event => set("weightKg", event.target.value)} /></label>
                    <label><span>Date</span><input type="date" value={form.date || ""} onChange={event => set("date", event.target.value)} /></label>
                    <label className="wide"><span>Notes</span><textarea value={form.notes || ""} onChange={event => set("notes", event.target.value)} /></label>
                </div>}
                <footer>
                    <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
                    <button className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                </footer>
            </form>
        </Modal>
    );
}
