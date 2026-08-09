import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { productsApi } from "../../api/products.api";
import { DataTable, Column } from "../../components/ui/DataTable";
import { SearchBar } from "../../components/ui/SearchBar";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency } from "../../utils/formatCurrency";
import { Product } from "../../types";

export default function ProductListPage() {
  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ["products", debouncedSearch, lowStock, page],
    queryFn: () =>
      productsApi.list({ page: String(page), limit: "10", search: debouncedSearch || undefined, lowStock: lowStock || undefined }),
  });

  const columns: Column<Product>[] = [
    { header: "Product", accessor: (p) => <Link to={`/products/${p.id}`} className="font-medium text-brand-700 hover:underline">{p.productName}</Link> },
    { header: "SKU", accessor: (p) => p.sku },
    { header: "Category", accessor: (p) => p.category },
    { header: "Unit Price", accessor: (p) => formatCurrency(p.unitPrice) },
    {
      header: "Stock",
      accessor: (p) => (
        <span className={p.currentStock <= p.minimumStock ? "font-semibold text-red-600" : ""}>{p.currentStock}</span>
      ),
    },
    { header: "Min Stock", accessor: (p) => p.minimumStock },
    { header: "Warehouse", accessor: (p) => p.warehouseLocation || "—" },
    {
      header: "Actions",
      accessor: (p) => (
        <Link to={`/products/${p.id}/edit`} className="text-sm font-medium text-brand-600 hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
          <Select value={lowStock} onChange={(e) => setLowStock(e.target.value)} className="max-w-[180px]">
            <option value="">All Stock Levels</option>
            <option value="true">Low Stock Only</option>
          </Select>
        </div>
        <Link to="/products/new">
          <Button>
            <Plus size={16} /> Add Product
          </Button>
        </Link>
      </div>

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} rowKey={(p) => p.id} emptyMessage="No products found" />
      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}
