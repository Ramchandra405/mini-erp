import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { inventoryApi } from "../../api/inventory.api";
import { productsApi } from "../../api/products.api";
import { StatCard, Card } from "../../components/ui/Card";
import { DataTable, Column } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { Pagination } from "../../components/ui/Pagination";
import { formatDate } from "../../utils/formatDate";
import { unwrapError } from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";

interface MovementFormValues {
  productId: string;
  quantity: number;
  movementType: "IN" | "OUT";
  reason: string;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const canAdjust = user?.role === "ADMIN" || user?.role === "WAREHOUSE";
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: summary } = useQuery({ queryKey: ["inventory-summary"], queryFn: inventoryApi.summary });
  const { data: movements, isLoading } = useQuery({
    queryKey: ["movements", page],
    queryFn: () => inventoryApi.listMovements({ page: String(page), limit: "10" }),
  });
  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsApi.list({ limit: "100" }),
    enabled: modalOpen,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MovementFormValues>({
    defaultValues: { movementType: "IN" },
  });

  const mutation = useMutation({
    mutationFn: (values: MovementFormValues) =>
      inventoryApi.createMovement({ ...values, quantity: Number(values.quantity) }),
    onSuccess: () => {
      showToast("Stock movement recorded");
      setModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
    },
    onError: (err) => showToast(unwrapError(err), "error"),
  });

  const columns: Column<any>[] = [
    { header: "Product", accessor: (m: any) => `${m.product?.productName} (${m.product?.sku})` },
    { header: "Type", accessor: (m: any) => <Badge color={m.movementType === "IN" ? "green" : "red"}>{m.movementType}</Badge> },
    { header: "Quantity", accessor: (m: any) => m.quantity },
    { header: "Reason", accessor: (m: any) => m.reason },
    { header: "Created By", accessor: (m: any) => m.createdBy?.name },
    { header: "Date", accessor: (m: any) => formatDate(m.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Stock Units" value={summary?.totalStockUnits ?? "—"} />
        <StatCard label="Total Products" value={summary?.totalProducts ?? "—"} />
        <StatCard label="Low Stock Items" value={summary?.lowStockCount ?? "—"} />
      </div>

      {summary?.lowStockProducts?.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Low Stock Products</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {summary.lowStockProducts.map((p: any) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>{p.productName} ({p.sku})</span>
                <Badge color="red">{p.currentStock} left</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Stock Movement History</h2>
        {canAdjust && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Manual Adjustment
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={movements?.items ?? []} isLoading={isLoading} rowKey={(m: any) => m.id} emptyMessage="No stock movements yet" />
      {movements && <Pagination page={movements.meta.page} totalPages={movements.meta.totalPages} onPageChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Manual Stock Adjustment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting || mutation.isPending} onClick={handleSubmit((v) => mutation.mutate(v))}>
              Save
            </Button>
          </>
        }
      >
        <form className="space-y-3">
          <Select label="Product" error={errors.productId?.message} {...register("productId", { required: "Required" })}>
            <option value="">Select a product</option>
            {products?.items?.map((p: any) => (
              <option key={p.id} value={p.id}>{p.productName} ({p.sku}) — stock: {p.currentStock}</option>
            ))}
          </Select>
          <Select label="Movement Type" {...register("movementType", { required: true })}>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </Select>
          <Input label="Quantity" type="number" error={errors.quantity?.message} {...register("quantity", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Must be > 0" } })} />
          <Input label="Reason" error={errors.reason?.message} {...register("reason", { required: "Required" })} />
        </form>
      </Modal>
    </div>
  );
}
