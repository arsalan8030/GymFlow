import { Activity, ArrowRight, Building2, UserCheck, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MetricCard from "../../components/common/MetricCard.jsx";

export default function AdminDashboard({ data, openModal }) {
    const cards = data.cards || {};
    const chart = (data.gymGrowth || []).map(row => ({ name: row.month, value: Number(row.count) }));
    return (
        <>
            <div className="page-heading">
                <div><p>PLATFORM ADMIN</p><h1>Good morning, Admin</h1></div>
                <button className="primary-button" onClick={() => openModal("gym")}>Create gym <ArrowRight size={16} /></button>
            </div>
            <div className="metrics-grid">
                <MetricCard title="Total gyms" value={cards.totalGyms || 0} icon={Building2} detail="Registered businesses" accent="lime" />
                <MetricCard title="Active gyms" value={cards.activeGyms || 0} icon={Activity} detail="Operating now" accent="blue" />
                <MetricCard title="Total members" value={cards.totalMembers || 0} icon={Users} detail="Across the platform" accent="violet" />
                <MetricCard title="Gym owners" value={cards.totalOwners || 0} icon={UserCheck} detail="Owner accounts" accent="orange" />
            </div>
            <div className="dashboard-grid">
                <article className="panel chart-panel">
                    <div className="panel-heading"><div><p>GROWTH</p><h3>Gym registrations</h3></div></div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chart}>
                            <defs><linearGradient id="limeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b8f500" stopOpacity=".25" /><stop offset="100%" stopColor="#b8f500" stopOpacity="0" /></linearGradient></defs>
                            <CartesianGrid stroke="#25282b" vertical={false} />
                            <XAxis dataKey="name" stroke="#777d85" tickLine={false} axisLine={false} />
                            <YAxis stroke="#777d85" tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: "#17191b", border: "1px solid #303438", borderRadius: 8 }} />
                            <Area type="monotone" dataKey="value" stroke="#b8f500" strokeWidth={2} fill="url(#limeFill)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </article>
                <article className="panel">
                    <div className="panel-heading"><div><p>STATUS</p><h3>Gym accounts</h3></div></div>
                    <div className="donut-list">
                        {(data.gymStatus || []).map(row => <div key={row.status}><span>{row.status}</span><strong>{row.count}</strong></div>)}
                    </div>
                </article>
            </div>
        </>
    );
}
