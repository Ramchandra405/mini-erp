import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { productsApi } from "../../api/products.api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/Toast";
import { unwrapError } from "../../api/axiosClient";

interface ProductFormValues {
  productName: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouseLocation?: string;
}

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: existing, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getById(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>();

  useEffect(() => {
    if (existing) {
      reset({
        productName: existing.productName,
        sku: existing.sku,
        category: existing.category,
        unitPrice: parseFloat(existing.unitPrice),
        currentStock: existing.currentStock,
        minimumStock: existing.minimumStock,
        warehouseLocation: existing.warehouseLocation ?? "",
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const payload = {
        ...values,
        unitPrice: Number(values.unitPrice),
        currentStock: Number(values.currentStock),
        minimumStock: Number(values.minimumStock),
      };
      return isEdit ? productsApi.update(id!, payload) : productsApi.create(payload);
    },
    onSuccess: (product) => {
      showToast(isEdit ? "Product updated" : "Product created");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate(`/products/${product.id}`);
    },
    onError: (err) => showToast(unwrapError(err), "error"),
  });

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{isEdit ? "Edit Product" : "Add Product"}</h2>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Product Name" error={errors.productName?.message} {...register("productName", { required: "Required" })} />
        <Input label="SKU / Code" error={errors.sku?.message} {...register("sku", { required: "Required" })} />
        <Input label="Category" error={errors.category?.message} {...register("category", { required: "Required" })} />
        <Input
          label="Unit Price"
          type="number"
          step="0.01"
          error={errors.unitPrice?.message}
          {...register("unitPrice", { required: "Required", valueAsNumber: true, min: { value: 0, message: "Must be >= 0" } })}
        />
        <Input
          label="Current Stock"
          type="number"
          error={errors.currentStock?.message}
          {...register("currentStock", { valueAsNumber: true, min: { value: 0, message: "Must be >= 0" } })}
        />
        <Input
          label="Minimum Stock Alert"
          type="number"
          error={errors.minimumStock?.message}
          {...register("minimumStock", { valueAsNumber: true, min: { value: 0, message: "Must be >= 0" } })}
        />
        <Input label="Warehouse / Location" {...register("warehouseLocation")} />

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            {isEdit ? "Save Changes" : "Create Product"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
