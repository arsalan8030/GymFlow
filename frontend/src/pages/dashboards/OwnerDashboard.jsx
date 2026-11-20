import { ArrowRight, CalendarDays, CircleDollarSign, Dumbbell, UserCheck, Users, WalletCards } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MetricCard from "../../components/common/MetricCard.jsx";

export default function OwnerDashboard({ data, openModal }) {
    const cards = data.cards || {};
    const chart = (data.monthlyRevenue || []).map(row => ({ name: row.month, value: Number(row.value) }));
    return (
        <>
            <div className="page-heading">
                <div><p>OWNER WORKSPACE</p><h1>Gym overview</h1></div>
                <button className="primary-button" onClick={() => openModal("member")}>Add member <ArrowRight size={16} /></button>
            </div>
            <div className="metrics-grid">
                <MetricCard title="Total members" value={cards.totalMembers || 0} icon={Users} detail="Registered" accent="lime" />
                <MetricCard title="Active members" value={cards.activeMembers || 0} icon={UserCheck} detail="Membership active" accent="blue" />
                <MetricCard title="Monthly revenue" value={`₹${Number(cards.monthlyRevenue || 0).toLocaleString("en-IN")}`} icon={WalletCards} detail="Collected this month" accent="violet" />
                <MetricCard title="Pending fees" value={`₹${Number(cards.pendingFees || 0).toLocaleString("en-IN")}`} icon={CircleDollarSign} detail="Outstanding balance" accent="orange" />
            </div>
            <div className="dashboard-grid">
                <article className="panel chart-panel">
                    <div className="panel-heading"><div><p>REVENUE</p><h3>Monthly collections</h3></div></div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chart}>
                            <defs><linearGradient id="limeFillOwner" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b8f500" stopOpacity=".25" /><stop offset="100%" stopColor="#b8f500" stopOpacity="0" /></linearGradient></defs>
                            <CartesianGrid stroke="#25282b" vertical={false} />
                            <XAxis dataKey="name" stroke="#777d85" tickLine={false} axisLine={false} />
                            <YAxis stroke="#777d85" tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: "#17191b", border: "1px solid #303438", borderRadius: 8 }} />
                            <Area type="monotone" dataKey="value" stroke="#b8f500" strokeWidth={2} fill="url(#limeFillOwner)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </article>
                <article className="panel">
                    <div className="panel-heading"><div><p>ACTIVITY</p><h3>Recent payments</h3></div></div>
                    <div className="recent-list">
                        {(data.recentPayments || []).map(payment => (
                            <div key={payment.id}>
                                <div className="mini-avatar">{payment.full_name?.[0] || "M"}</div>
                                <div><strong>{payment.full_name}</strong><span>{payment.member_id}</span></div>
                                <b>₹{Number(payment.amount).toLocaleString("en-IN")}</b>
                            </div>
                        ))}
                        {!data.recentPayments?.length && <div className="empty-inline">No payments recorded yet</div>}
                    </div>
                </article>
            </div>
            <div className="quick-actions">
                <button onClick={() => openModal("member")}><Users size={18} />Add member</button>
                <button onClick={() => openModal("payment")}><CircleDollarSign size={18} />Record payment</button>
                <button onClick={() => openModal("attendance")}><CalendarDays size={18} />Mark attendance</button>
                <button onClick={() => openModal("plan")}><Dumbbell size={18} />Create plan</button>
            </div>
        </>
    );
}
