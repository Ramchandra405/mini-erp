import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { challansApi } from "../../api/challans.api";
import { DataTable, Column } from "../../components/ui/DataTable";
import { SearchBar } from "../../components/ui/SearchBar";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Badge, statusBadgeColor } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { Challan } from "../../types";
import { useAuth } from "../../context/AuthContext";

export default function ChallanListPage() {
  const { user } = useAuth();
  const canCreate = user?.role === "ADMIN" || user?.role === "SALES";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["challans", debouncedSearch, status, page],
    queryFn: () => challansApi.list({ page: String(page), limit: "10", search: debouncedSearch || undefined, status: status || undefined }),
  });

  const columns: Column<Challan>[] = [
    { header: "Challan #", accessor: (c) => <Link to={`/challans/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.challanNumber}</Link> },
    { header: "Customer", accessor: (c) => c.customer?.customerName ?? "—" },
    { header: "Qty", accessor: (c) => c.totalQuantity },
    { header: "Amount", accessor: (c) => formatCurrency(c.totalAmount) },
    { header: "Status", accessor: (c) => <Badge color={statusBadgeColor(c.status)}>{c.status}</Badge> },
    { header: "Created", accessor: (c) => formatDate(c.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by challan number..." />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[160px]">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
        {canCreate && (
          <Link to="/challans/new">
            <Button><Plus size={16} /> New Challan</Button>
          </Link>
        )}
      </div>

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} rowKey={(c) => c.id} emptyMessage="No challans found" />
      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}
