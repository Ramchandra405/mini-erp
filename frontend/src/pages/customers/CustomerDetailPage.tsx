import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { customersApi } from "../../api/customers.api";
import { Card } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { Badge, statusBadgeColor } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../utils/formatDate";
import { unwrapError } from "../../api/axiosClient";
import { EmptyState } from "../../components/ui/EmptyState";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersApi.getById(id!),
  });

  const addFollowUp = useMutation({
    mutationFn: () => customersApi.createFollowUp(id!, { note, followUpDate: followUpDate || undefined }),
    onSuccess: () => {
      showToast("Follow-up added");
      setFollowUpOpen(false);
      setNote("");
      setFollowUpDate("");
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
    },
    onError: (err) => showToast(unwrapError(err), "error"),
  });

  if (isLoading || !customer) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{customer.customerName}</h2>
          <Badge color={statusBadgeColor(customer.status)}>{customer.status}</Badge>
        </div>
        <Link to={`/customers/${id}/edit`}>
          <Button variant="secondary">
            <Pencil size={15} /> Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Contact Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Mobile</dt><dd>{customer.mobileNumber}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{customer.email || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Address</dt><dd className="text-right">{customer.address || "—"}</dd></div>
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Business Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Business Name</dt><dd>{customer.businessName || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">GST Number</dt><dd>{customer.gstNumber || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Customer Type</dt><dd>{customer.customerType}</dd></div>
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Follow-up Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Next Follow-up</dt><dd>{formatDate(customer.followUpDate)}</dd></div>
          </dl>
          <p className="mt-3 text-sm text-slate-600">{customer.notes || "No notes yet."}</p>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Related Sales Challans</h3>
          </div>
          {(!customer.challans || customer.challans.length === 0) ? (
            <p className="text-sm text-slate-400">No challans for this customer yet</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {customer.challans.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <Link to={`/challans/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.challanNumber}</Link>
                  <Badge color={statusBadgeColor(c.status)}>{c.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Follow-up History</h3>
          <Button variant="secondary" onClick={() => setFollowUpOpen(true)}>
            Add Follow-up
          </Button>
        </div>
        {customer.followUps.length === 0 ? (
          <EmptyState message="No follow-ups recorded yet" />
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {customer.followUps.map((f: any) => (
              <li key={f.id} className="py-3">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-800">{f.createdBy?.name}</span>
                  <span className="text-xs text-slate-400">{formatDate(f.createdAt)}</span>
                </div>
                <p className="mt-1 text-slate-600">{f.note}</p>
                {f.followUpDate && <p className="mt-1 text-xs text-slate-400">Next: {formatDate(f.followUpDate)}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        title="Add Follow-up"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFollowUpOpen(false)}>Cancel</Button>
            <Button loading={addFollowUp.isPending} onClick={() => addFollowUp.mutate()} disabled={!note}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Note</span>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Next Follow-up Date</span>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
