import { useEffect, useState } from "react";
import { Bell, Dumbbell, Search, UserCheck } from "lucide-react";
import { api } from "../lib/api.js";
import StatusBadge from "../components/common/StatusBadge.jsx";

export default function FeaturePage({ section, user, openModal }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        let active = true;
        async function load() {
            setLoading(true);
            setError("");
            try {
                if (user.role === "SUPER_ADMIN" && section === "Gyms") {
                    const data = await api(`/api/v1/admin/gyms?search=${encodeURIComponent(search)}`);
                    if (active) setItems(data.gyms || []);
                } else if (user.role === "SUPER_ADMIN" && section === "Owners") {
                    const data = await api("/api/v1/admin/owners");
                    if (active) setItems(data.owners || []);
                } else if (user.role === "SUPER_ADMIN" && section === "Plans") {
                    const data = await api("/api/v1/admin/plans");
                    if (active) setItems(data.plans || []);
                } else if (user.role === "SUPER_ADMIN" && section === "Activity Logs") {
                    const data = await api("/api/v1/admin/activity");
                    if (active) setItems(data.activity || []);
                } else if (user.role === "SUPER_ADMIN" && section === "Analytics") {
                    const data = await api("/api/v1/admin/dashboard");
                    if (active) setItems(data.gymGrowth || []);
                } else if (user.role === "OWNER" && section === "Reports") {
                    const data = await api("/api/v1/owner/reports");
                    if (active) setItems(data.monthlyRevenue || []);
                } else if (section === "Members") {
                    const data = await api(`/api/v1/owner/members?search=${encodeURIComponent(search)}`);
                    if (active) setItems(data.members || []);
                } else if (section === "Plans") {
                    const data = await api("/api/v1/owner/memberships");
                    if (active) setItems(data.plans || []);
                } else if (section === "Payments") {
                    const data = await api("/api/v1/owner/payments");
                    if (active) setItems(data.payments || []);
                } else if (section === "Attendance") {
                    const data = await api("/api/v1/owner/attendance");
                    if (active) setItems(data.attendance || []);
                } else if (section === "Trainers") {
                    const data = await api("/api/v1/owner/trainers");
                    if (active) setItems(data.trainers || []);
                } else if (section === "Announcements") {
                    const data = await api("/api/v1/owner/announcements");
                    if (active) setItems(data.announcements || []);
                } else if (user.role === "MEMBER") {
                    const map = {
                        "My Profile": "profile", Membership: "membership", Payments: "payments",
                        Attendance: "attendance", "Workout Plan": "workouts",
                        "Fitness Progress": "progress", Notifications: "notifications"
                    };
                    const resource = map[section] || "profile";
                    const data = await api(`/api/v1/member/${resource}`);
                    if (active) setItems(data[resource] || []);
                } else if (active) {
                    setItems([]);
                }
            } catch (requestError) {
                if (active) setError(requestError.message);
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => { active = false; };
    }, [section, search, user.role]);

    const ownerAction = user.role === "SUPER_ADMIN" && section === "Gyms" ? "gym"
        : user.role === "SUPER_ADMIN" && section === "Plans" ? "platformPlan"
            : section === "Members" ? "member"
        : section === "Plans" ? "plan"
            : section === "Payments" ? "payment"
                : section === "Attendance" ? "attendance"
                    : section === "Trainers" ? "trainer"
                        : section === "Announcements" ? "announcement" : null;

    return (
        <>
            <div className="page-heading">
                <div><p>WORKSPACE</p><h1>{section}</h1></div>
                {ownerAction && <button className="primary-button" onClick={() => openModal(ownerAction)}>
                    Add {section === "Plans" ? "plan" : section.slice(0, -1).toLowerCase()}
                </button>}
            </div>
            <section className="panel table-panel">
                {["Gyms", "Members", "Plans", "Payments", "Attendance", "Trainers", "Announcements"].includes(section) && (
                    <div className="table-toolbar">
                        <div className="search-box">
                            <Search size={16} />
                            <input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${section.toLowerCase()}...`} />
                        </div>
                    </div>
                )}
                {loading ? <div className="loading-row">Loading...</div>
                    : error ? <div className="error-inline">{error}</div>
                        : <DataView section={section} items={items} />}
            </section>
        </>
    );
}

function DataView({ section, items }) {
    if (!items.length) return (
        <div className="empty-state"><Dumbbell size={28} /><strong>Nothing here yet</strong><span>New records will appear here.</span></div>
    );
    if (section === "Gyms") return (
        <div className="table-wrap"><table>
            <thead><tr><th>Gym</th><th>Code</th><th>Owner</th><th>Contact</th><th>Plan</th><th>Status</th></tr></thead>
            <tbody>{items.map(row => (
                <tr key={row.id}><td><strong>{row.gym_name}</strong><span>{row.city || row.address}</span></td>
                    <td>{row.gym_code}</td><td>{row.owner_name || "—"}</td><td>{row.email || row.phone || "—"}</td>
                    <td>{row.subscription?.planName || "—"}</td><td><StatusBadge status={row.status} /></td></tr>
            ))}</tbody>
        </table></div>
    );
    if (section === "Owners") return (
        <div className="table-wrap"><table>
            <thead><tr><th>Owner account</th><th>Gym</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>{items.map(row => (
                <tr key={row.id}><td><strong>{row.email || row.loginId}</strong><span>{row.loginId}</span></td>
                    <td>{row.gym_id?.gymName || "—"}</td><td><StatusBadge status={row.status} /></td>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td></tr>
            ))}</tbody>
        </table></div>
    );
    if (section === "Plans" && items[0]?.monthly_price !== undefined) return (
        <div className="record-grid">{items.map(row => (
            <article key={row.id}><div><Dumbbell size={18} /><StatusBadge status={row.status} /></div><h3>{row.name}</h3>
                <p>{row.max_members} members · ₹{Number(row.yearly_price).toLocaleString("en-IN")} yearly</p>
                <strong>₹{Number(row.monthly_price).toLocaleString("en-IN")} / month</strong></article>
        ))}</div>
    );
    if (section === "Activity Logs") return (
        <div className="table-wrap"><table>
            <thead><tr><th>Action</th><th>Actor</th><th>Gym</th><th>Time</th></tr></thead>
            <tbody>{items.map(row => (
                <tr key={row.id}><td><strong>{row.action}</strong><span>{row.entity_type} {row.entity_id}</span></td>
                    <td>{row.actor_user_id?.loginId || "System"}</td><td>{row.gym_id?.gymName || "Platform"}</td>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td></tr>
            ))}</tbody>
        </table></div>
    );
    if (section === "Analytics" || section === "Reports") return (
        <div className="table-wrap"><table>
            <thead><tr><th>Period</th><th>Recorded total</th></tr></thead>
            <tbody>{items.map((row, index) => (
                <tr key={row.month || row.id || index}><td>{row.month || row.status || row.payment_method || "—"}</td>
                    <td>{Number(row.value ?? row.total ?? row.count ?? 0).toLocaleString("en-IN")}</td></tr>
            ))}</tbody>
        </table></div>
    );
    if (section === "Members") return (
        <div className="table-wrap"><table>
            <thead><tr><th>Member</th><th>Member ID</th><th>Plan</th><th>Expiry</th><th>Pending</th><th>Status</th></tr></thead>
            <tbody>{items.map(row => (
                <tr key={row.id}>
                    <td><strong>{row.full_name}</strong><span>{row.phone}</span></td>
                    <td>{row.member_id}</td><td>{row.membership_plan || "—"}</td><td>{row.end_date || "—"}</td>
                    <td>₹{Number(row.pending_amount || 0).toLocaleString("en-IN")}</td><td><StatusBadge status={row.status} /></td>
                </tr>
            ))}</tbody>
        </table></div>
    );
    if (section === "Plans") return (
        <div className="record-grid">{items.map(row => (
            <article key={row.id}><div><Dumbbell size={18} /><StatusBadge status={row.status} /></div><h3>{row.name}</h3>
                <p>{row.duration_days} days</p><strong>₹{Number(row.price).toLocaleString("en-IN")}</strong></article>
        ))}</div>
    );
    if (section === "Payments") return (
        <div className="table-wrap"><table>
            <thead><tr><th>Receipt</th><th>Member</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
            <tbody>{items.map(row => (
                <tr key={row.id}><td>{row.receipt_number || "Pending"}</td>
                    <td><strong>{row.full_name}</strong><span>{row.member_id}</span></td>
                    <td>₹{Number(row.amount).toLocaleString("en-IN")}</td>
                    <td>{String(row.payment_method).replace("_", " ")}</td><td>{row.payment_date}</td></tr>
            ))}</tbody>
        </table></div>
    );
    if (section === "Attendance") return (
        <div className="table-wrap"><table>
            <thead><tr><th>Member</th><th>Member ID</th><th>Date</th><th>Check-in</th><th>Status</th></tr></thead>
            <tbody>{items.map(row => (
                <tr key={row.id}><td><strong>{row.full_name}</strong></td><td>{row.member_id}</td>
                    <td>{row.attendance_date}</td><td>{row.check_in_time || "—"}</td><td><StatusBadge status={row.status} /></td></tr>
            ))}</tbody>
        </table></div>
    );
    if (section === "Trainers") return (
        <div className="record-grid">{items.map(row => (
            <article key={row.id}><div><UserCheck size={18} /><StatusBadge status={row.status} /></div><h3>{row.name}</h3>
                <p>{row.specialization || "General fitness"}</p><span>{row.phone || "No phone"}</span></article>
        ))}</div>
    );
    if (section === "Announcements") return (
        <div className="record-grid">{items.map(row => (
            <article key={row.id}><div><Bell size={18} /><StatusBadge status={row.status} /></div><h3>{row.title}</h3><p>{row.message}</p></article>
        ))}</div>
    );
    return (
        <div className="record-grid">{items.map((row, index) => (
            <article key={row.id || index}><h3>{row.plan_name || row.title || row.full_name || `Record ${index + 1}`}</h3>
                <p>{row.message || row.specialization || row.status || row.start_date || ""}</p></article>
        ))}</div>
    );
}
