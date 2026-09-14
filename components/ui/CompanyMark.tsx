export default function CompanyMark({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      className={"company-mark" + (large ? " company-mark-large" : "")}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
