const statusConfig = {
  0: { label: 'Created', color: 'text-blue-400 bg-blue-400/10 ring-blue-400/20' },
  1: { label: 'Paid', color: 'text-yellow-400 bg-yellow-400/10 ring-yellow-400/20' },
  2: { label: 'Settled', color: 'text-green-400 bg-green-400/10 ring-green-400/20' },
  3: { label: 'Refunded', color: 'text-orange-400 bg-orange-400/10 ring-orange-400/20' },
  4: { label: 'Cancelled', color: 'text-red-400 bg-red-400/10 ring-red-400/20' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig[0];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${config.color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {config.label}
    </span>
  );
}
