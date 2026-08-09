import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { customersApi } from "../../api/customers.api";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/Toast";
import { unwrapError } from "../../api/axiosClient";

interface CustomerFormValues {
  customerName: string;
  mobileNumber: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  customerType: string;
  address?: string;
  status: string;
  followUpDate?: string;
  notes?: string;
}

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: existing, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersApi.getById(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    defaultValues: { customerType: "RETAIL", status: "LEAD" },
  });

  useEffect(() => {
    if (existing) {
      reset({
        customerName: existing.customerName,
        mobileNumber: existing.mobileNumber,
        email: existing.email ?? "",
        businessName: existing.businessName ?? "",
        gstNumber: existing.gstNumber ?? "",
        customerType: existing.customerType,
        address: existing.address ?? "",
        status: existing.status,
        followUpDate: existing.followUpDate ? existing.followUpDate.substring(0, 10) : "",
        notes: existing.notes ?? "",
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      isEdit ? customersApi.update(id!, { ...values }) : customersApi.create({ ...values }),
    onSuccess: (customer) => {
      showToast(isEdit ? "Customer updated" : "Customer created");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      navigate(`/customers/${customer.id}`);
    },
    onError: (err) => showToast(unwrapError(err), "error"),
  });

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{isEdit ? "Edit Customer" : "Add Customer"}</h2>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Customer Name" error={errors.customerName?.message} {...register("customerName", { required: "Required" })} />
        <Input label="Mobile Number" error={errors.mobileNumber?.message} {...register("mobileNumber", { required: "Required" })} />
        <Input label="Email" type="email" {...register("email")} />
        <Input label="Business Name" {...register("businessName")} />
        <Input label="GST Number (optional)" {...register("gstNumber")} />
        <Select label="Customer Type" {...register("customerType", { required: true })}>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </Select>
        <Select label="Status" {...register("status", { required: true })}>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <Input label="Follow-up Date" type="date" {...register("followUpDate")} />
        <div className="sm:col-span-2">
          <Input label="Address" {...register("address")} />
        </div>
        <div className="sm:col-span-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Notes</span>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...register("notes")}
            />
          </label>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            {isEdit ? "Save Changes" : "Create Customer"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
