export default function StatusBadge({ value }: { value: string }) {
  return (
    <span className="badge" data-status={value}>
      {value}
    </span>
  );
}
