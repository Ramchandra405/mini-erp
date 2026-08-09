import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { productsApi } from "../../api/products.api";
import { inventoryApi } from "../../api/inventory.api";
import { Card } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function ProductDetailPage() {
  const { id } = useParams();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getById(id!),
  });

  const { data: movements } = useQuery({
    queryKey: ["movements", id],
    queryFn: () => inventoryApi.listMovements({ productId: id!, limit: "10" }),
    enabled: Boolean(id),
  });

  if (isLoading || !product) return <LoadingState />;

  const isLow = product.currentStock <= product.minimumStock;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{product.productName}</h2>
          <p className="text-sm text-slate-500">SKU: {product.sku}</p>
        </div>
        <Link to={`/products/${id}/edit`}>
          <Button variant="secondary">
            <Pencil size={15} /> Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-xs text-slate-500">Category</p><p className="mt-1 font-semibold">{product.category}</p></Card>
        <Card><p className="text-xs text-slate-500">Unit Price</p><p className="mt-1 font-semibold">{formatCurrency(product.unitPrice)}</p></Card>
        <Card>
          <p className="text-xs text-slate-500">Current Stock</p>
          <p className={`mt-1 font-semibold ${isLow ? "text-red-600" : ""}`}>
            {product.currentStock} {isLow && <Badge color="red">Low</Badge>}
          </p>
        </Card>
        <Card><p className="text-xs text-slate-500">Warehouse</p><p className="mt-1 font-semibold">{product.warehouseLocation || "—"}</p></Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Stock Movements</h3>
        {(!movements || movements.items.length === 0) ? (
          <p className="text-sm text-slate-400">No stock movements recorded yet</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {movements.items.map((m: any) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <span>{m.reason}</span>
                <div className="flex items-center gap-3">
                  <Badge color={m.movementType === "IN" ? "green" : "red"}>{m.movementType} {m.quantity}</Badge>
                  <span className="text-xs text-slate-400">{formatDate(m.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
