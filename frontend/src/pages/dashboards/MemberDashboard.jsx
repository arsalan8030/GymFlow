import { Activity, Bell, CalendarDays, CircleDollarSign, Dumbbell } from "lucide-react";
import MetricCard from "../../components/common/MetricCard.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";

export default function MemberDashboard({ data, openModal }) {
    const membership = data.membership;
    const remaining = membership?.end_date
        ? Math.max(0, Math.ceil((new Date(membership.end_date) - new Date()) / 86400000))
        : 0;
    const paid = Number(membership?.paid_amount || 0);
    const fee = Number(membership?.total_fee || 0);
    return (
        <>
            <div className="page-heading">
                <div><p>MEMBER PORTAL</p><h1>Welcome back, {data.member?.full_name?.split(" ")[0] || "Member"}</h1></div>
                <button className="secondary-button" onClick={() => openModal("weight")}>Log weight</button>
            </div>
            <div className="metrics-grid">
                <MetricCard title="Membership" value={membership?.plan_name || "Not assigned"} icon={Dumbbell} detail={membership?.status || "Inactive"} accent="lime" />
                <MetricCard title="Days remaining" value={remaining} icon={CalendarDays} detail={membership?.end_date || "No expiry"} accent="blue" />
                <MetricCard title="Payment balance" value={`₹${Math.max(0, fee - paid).toLocaleString("en-IN")}`} icon={CircleDollarSign} detail={`₹${paid.toLocaleString("en-IN")} paid`} accent="violet" />
                <MetricCard title="Recent check-ins" value={(data.attendance || []).filter(row => row.status === "PRESENT").length} icon={Activity} detail="Latest attendance" accent="orange" />
            </div>
            <div className="dashboard-grid">
                <article className="panel">
                    <div className="panel-heading"><div><p>MEMBERSHIP</p><h3>Account details</h3></div><StatusBadge status={membership?.status} /></div>
                    <div className="detail-grid">
                        <div><span>Member ID</span><strong>{data.member?.member_id}</strong></div>
                        <div><span>Start date</span><strong>{membership?.start_date || "—"}</strong></div>
                        <div><span>Expiry date</span><strong>{membership?.end_date || "—"}</strong></div>
                        <div><span>Plan</span><strong>{membership?.plan_name || "—"}</strong></div>
                    </div>
                </article>
                <article className="panel">
                    <div className="panel-heading"><div><p>ANNOUNCEMENTS</p><h3>Gym updates</h3></div></div>
                    <div className="recent-list">
                        {(data.announcements || []).map(item => (
                            <div key={item.id}>
                                <div className="mini-avatar"><Bell size={15} /></div>
                                <div><strong>{item.title}</strong><span>{item.message}</span></div>
                            </div>
                        ))}
                        {!data.announcements?.length && <div className="empty-inline">No new announcements</div>}
                    </div>
                </article>
            </div>
        </>
    );
}
