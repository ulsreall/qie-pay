const statusConfig = {
  0: { label: 'Created', badgeClass: 'badge badge-created' },
  1: { label: 'Paid', badgeClass: 'badge badge-warning' },
  2: { label: 'Settled', badgeClass: 'badge badge-success' },
  3: { label: 'Refunded', badgeClass: 'badge badge-info' },
  4: { label: 'Cancelled', badgeClass: 'badge badge-danger' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig[0];

  return (
    <span className={config.badgeClass}>
      {config.label}
    </span>
  );
}
