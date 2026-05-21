const dotColors = {
  0: 'bg-sky-400',
  1: 'bg-amber-400',
  2: 'bg-[#34D399]',
  3: 'bg-blue-400',
  4: 'bg-red-400',
};

const statusConfig = {
  0: { label: 'Created' },
  1: { label: 'Paid' },
  2: { label: 'Settled' },
  3: { label: 'Refunded' },
  4: { label: 'Cancelled' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig[0];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors[0]}`} />
      <span className="text-xs text-[#A1A1AA]">{config.label}</span>
    </span>
  );
}
