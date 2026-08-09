import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, Package, Boxes, FileText, AlertTriangle } from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import { StatCard, Card } from "../components/ui/Card";
import { LoadingState } from "../components/ui/LoadingState";
import { Badge, statusBadgeColor } from "../components/ui/Badge";
import { formatDate } from "../utils/formatDate";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.summary });

  if (isLoading || !data) return <LoadingState label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Customers" value={data.totalCustomers} icon={<Users size={18} />} />
        <StatCard label="Active Customers" value={data.activeCustomers} icon={<Users size={18} />} />
        <StatCard label="Total Products" value={data.totalProducts} icon={<Package size={18} />} />
        <StatCard label="Stock Units" value={data.totalStockUnits} icon={<Boxes size={18} />} />
        <StatCard label="Low Stock Items" value={data.lowStockCount} icon={<AlertTriangle size={18} />} />
        <StatCard label="Draft Challans" value={data.draftChallans} icon={<FileText size={18} />} />
        <StatCard label="Confirmed Challans" value={data.confirmedChallans} icon={<FileText size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Challans</h2>
            <Link to="/challans" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {data.recentChallans.length === 0 && <p className="text-sm text-slate-400">No challans yet</p>}
          <ul className="divide-y divide-slate-100">
            {data.recentChallans.map((c: any) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{c.challanNumber}</p>
                  <p className="text-xs text-slate-400">{c.customer?.customerName}</p>
                </div>
                <Badge color={statusBadgeColor(c.status)}>{c.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent Stock Movements</h2>
          {data.recentMovements.length === 0 && <p className="text-sm text-slate-400">No movements yet</p>}
          <ul className="divide-y divide-slate-100">
            {data.recentMovements.map((m: any) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{m.product?.productName}</p>
                  <p className="text-xs text-slate-400">{formatDate(m.createdAt)}</p>
                </div>
                <Badge color={statusBadgeColor(m.movementType)}>
                  {m.movementType} {m.quantity}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Upcoming Follow-ups</h2>
          {data.upcomingFollowUps.length === 0 && <p className="text-sm text-slate-400">No upcoming follow-ups</p>}
          <ul className="divide-y divide-slate-100">
            {data.upcomingFollowUps.map((f: any) => (
              <li key={f.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-slate-800">{f.customerName}</span>
                <span className="text-xs text-slate-400">{formatDate(f.followUpDate)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
