import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus } from "lucide-react";
import { challansApi } from "../../api/challans.api";
import { customersApi } from "../../api/customers.api";
import { productsApi } from "../../api/products.api";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency } from "../../utils/formatCurrency";
import { unwrapError } from "../../api/axiosClient";

interface LineItem {
  productId: string;
  quantity: number;
}

export default function ChallanCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: 1 }]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingChallanId, setPendingChallanId] = useState<string | null>(null);

  const { data: customers } = useQuery({ queryKey: ["customers-all"], queryFn: () => customersApi.list({ limit: "100" }) });
  const { data: products } = useQuery({ queryKey: ["products-all"], queryFn: () => productsApi.list({ limit: "200" }) });

  const productMap = new Map((products?.items ?? []).map((p: any) => [p.id, p]));

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: 1 }]);
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, i) => {
    const product = productMap.get(i.productId) as any;
    const price = product ? parseFloat(product.unitPrice) : 0;
    return sum + price * (Number(i.quantity) || 0);
  }, 0);

  const createMutation = useMutation({
    mutationFn: () =>
      challansApi.create({
        customerId,
        items: items.filter((i) => i.productId && i.quantity > 0),
      }),
    onSuccess: (challan) => {
      showToast(`Challan ${challan.challanNumber} saved as draft`);
      queryClient.invalidateQueries({ queryKey: ["challans"] });
      navigate(`/challans/${challan.id}`);
    },
    onError: (err) => showToast(unwrapError(err), "error"),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const draft = await challansApi.create({ customerId, items: items.filter((i) => i.productId && i.quantity > 0) });
      setPendingChallanId(draft.id);
      return challansApi.confirm(draft.id);
    },
    onSuccess: (challan) => {
      showToast(`Challan ${challan.challanNumber} confirmed — stock updated`);
      queryClient.invalidateQueries({ queryKey: ["challans"] });
      navigate(`/challans/${challan.id}`);
    },
    onError: (err) => {
      showToast(unwrapError(err), "error");
      if (pendingChallanId) navigate(`/challans/${pendingChallanId}`);
    },
  });

  const canSubmit = customerId && items.some((i) => i.productId && i.quantity > 0);

  return (
    <Card className="max-w-4xl space-y-5">
      <h2 className="text-base font-semibold text-slate-900">Create Sales Challan</h2>

      <Select label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
        <option value="">Select a customer</option>
        {customers?.items?.map((c: any) => (
          <option key={c.id} value={c.id}>{c.customerName}</option>
        ))}
      </Select>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Items</span>
          <Button type="button" variant="secondary" onClick={addItem}>
            <Plus size={15} /> Add Product
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-left">Available Stock</th>
                <th className="px-3 py-2 text-left">Quantity</th>
                <th className="px-3 py-2 text-left">Unit Price</th>
                <th className="px-3 py-2 text-left">Total</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const product = productMap.get(item.productId) as any;
                const lineTotal = product ? parseFloat(product.unitPrice) * (Number(item.quantity) || 0) : 0;
                const exceedsStock = product && item.quantity > product.currentStock;
                return (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <Select value={item.productId} onChange={(e) => updateItem(index, { productId: e.target.value })}>
                        <option value="">Select product</option>
                        {products?.items?.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.productName}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{product?.sku ?? "—"}</td>
                    <td className={`px-3 py-2 ${exceedsStock ? "font-semibold text-red-600" : ""}`}>{product?.currentStock ?? "—"}</td>
                    <td className="px-3 py-2 w-28">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">{product ? formatCurrency(product.unitPrice) : "—"}</td>
                    <td className="px-3 py-2 font-medium">{formatCurrency(lineTotal)}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-8 rounded-lg bg-slate-50 px-4 py-3 text-sm">
        <div><span className="text-slate-500">Total Quantity: </span><span className="font-semibold">{totalQuantity}</span></div>
        <div><span className="text-slate-500">Total Amount: </span><span className="font-semibold">{formatCurrency(totalAmount)}</span></div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" disabled={!canSubmit} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
          Save Draft
        </Button>
        <Button disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
          Confirm Challan
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Challan"
        message="This will deduct stock immediately and cannot be undone. Continue?"
        confirmLabel="Yes, Confirm"
        loading={confirmMutation.isPending}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmMutation.mutate();
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
