export default function StatusBadge({ status }) {
    const normalized = String(status || "ACTIVE").toUpperCase();
    return <span className={`status ${normalized}`}>{normalized}</span>;
}
