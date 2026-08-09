import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { customersApi } from "../../api/customers.api";
import { DataTable, Column } from "../../components/ui/DataTable";
import { SearchBar } from "../../components/ui/SearchBar";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Badge, statusBadgeColor } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { formatDate } from "../../utils/formatDate";
import { Customer } from "../../types";

export default function CustomerListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch, status, type, page],
    queryFn: () =>
      customersApi.list({
        page: String(page),
        limit: "10",
        search: debouncedSearch || undefined,
        status: status || undefined,
        customerType: type || undefined,
      }),
  });

  const columns: Column<Customer>[] = [
    { header: "Customer", accessor: (c) => <Link to={`/customers/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.customerName}</Link> },
    { header: "Business", accessor: (c) => c.businessName || "—" },
    { header: "Mobile", accessor: (c) => c.mobileNumber },
    { header: "Type", accessor: (c) => c.customerType },
    { header: "Status", accessor: (c) => <Badge color={statusBadgeColor(c.status)}>{c.status}</Badge> },
    { header: "Follow-up", accessor: (c) => formatDate(c.followUpDate) },
    {
      header: "Actions",
      accessor: (c) => (
        <Link to={`/customers/${c.id}/edit`} className="text-sm font-medium text-brand-600 hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[160px]">
            <option value="">All Statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="max-w-[160px]">
            <option value="">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </Select>
        </div>
        <Link to="/customers/new">
          <Button>
            <Plus size={16} /> Add Customer
          </Button>
        </Link>
      </div>

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} rowKey={(c) => c.id} emptyMessage="No customers found" />
      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}
