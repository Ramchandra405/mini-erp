import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { challansApi } from "../../api/challans.api";
import { Card } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { Badge, statusBadgeColor } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { unwrapError } from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";

export default function ChallanDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const canAct = user?.role === "ADMIN" || user?.role === "SALES";

  const { data: challan, isLoading } = useQuery({
    queryKey: ["challan", id],
    queryFn: () => challansApi.getById(id!),
  });

  const confirmMutation = useMutation({
    mutationFn: () => challansApi.confirm(id!),
    onSuccess: () => {
      showToast("Challan confirmed — stock updated");
      queryClient.invalidateQueries({ queryKey: ["challan", id] });
      queryClient.invalidateQueries({ queryKey: ["challans"] });
    },
    onError: (err) => showToast(unwrapError(err), "error"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => challansApi.cancel(id!),
    onSuccess: () => {
      showToast("Challan cancelled");
      queryClient.invalidateQueries({ queryKey: ["challan", id] });
      queryClient.invalidateQueries({ queryKey: ["challans"] });
    },
    onError: (err) => showToast(unwrapError(err), "error"),
  });

  if (isLoading || !challan) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{challan.challanNumber}</h2>
          <Link to={`/customers/${challan.customerId}`} className="text-sm text-brand-600 hover:underline">
            {challan.customer?.customerName}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={statusBadgeColor(challan.status)}>{challan.status}</Badge>
          {canAct && challan.status === "DRAFT" && (
            <>
              <Button variant="secondary" onClick={() => setCancelOpen(true)}>Cancel</Button>
              <Button onClick={() => setConfirmOpen(true)}>Confirm</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><p className="text-xs text-slate-500">Total Quantity</p><p className="mt-1 text-lg font-semibold">{challan.totalQuantity}</p></Card>
        <Card><p className="text-xs text-slate-500">Total Amount</p><p className="mt-1 text-lg font-semibold">{formatCurrency(challan.totalAmount)}</p></Card>
        <Card><p className="text-xs text-slate-500">Created</p><p className="mt-1 text-lg font-semibold">{formatDate(challan.createdAt)}</p></Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Items (product snapshot at time of creation)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-left">Quantity</th>
                <th className="px-3 py-2 text-left">Unit Price</th>
                <th className="px-3 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challan.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{item.productNameSnapshot}</td>
                  <td className="px-3 py-2 text-slate-500">{item.skuSnapshot}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2">{formatCurrency(item.unitPriceSnapshot)}</td>
                  <td className="px-3 py-2 font-medium">{formatCurrency(parseFloat(item.unitPriceSnapshot) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Challan"
        message="This will deduct stock immediately and cannot be undone. Continue?"
        confirmLabel="Yes, Confirm"
        loading={confirmMutation.isPending}
        onConfirm={() => { setConfirmOpen(false); confirmMutation.mutate(); }}
        onClose={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        open={cancelOpen}
        title="Cancel Challan"
        message="This draft challan will be cancelled. This cannot be undone."
        confirmLabel="Yes, Cancel"
        danger
        loading={cancelMutation.isPending}
        onConfirm={() => { setCancelOpen(false); cancelMutation.mutate(); }}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
}
