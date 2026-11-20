export default function MetricCard({ title, value, icon: Icon, detail, accent }) {
    return (
        <article className="metric-card">
            <div className={`metric-icon ${accent || ""}`}>{Icon && <Icon size={20} />}</div>
            <div>
                <p>{title}</p>
                <strong>{value}</strong>
                {detail && <small>{detail}</small>}
            </div>
        </article>
    );
}
