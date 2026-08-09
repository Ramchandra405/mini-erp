type BadgeColor = "green" | "yellow" | "red" | "blue" | "gray";

const colorClasses: Record<BadgeColor, string> = {
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-slate-100 text-slate-600",
};

export function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: BadgeColor }) {
  return <span className={`badge ${colorClasses[color]}`}>{children}</span>;
}

export function statusBadgeColor(status: string): BadgeColor {
  switch (status) {
    case "ACTIVE":
    case "CONFIRMED":
    case "IN":
      return "green";
    case "LEAD":
    case "DRAFT":
      return "yellow";
    case "INACTIVE":
    case "CANCELLED":
    case "OUT":
      return "red";
    default:
      return "gray";
  }
}
