import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { usersApi } from "../../api/users.api";
import { DataTable, Column } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useToast } from "../../components/ui/Toast";
import { unwrapError } from "../../api/axiosClient";

interface UserFormValues {
  name: string;
  email: string;
  password: string;
  role: string;
}

export default function UserListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list({ limit: "50" }) });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserFormValues>({
    defaultValues: { role: "SALES" },
  });

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) => usersApi.create({ ...values }),
    onSuccess: () => {
      showToast("User created");
      setModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => showToast(unwrapError(err), "error"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      showToast("User deactivated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const columns: Column<any>[] = [
    { header: "Name", accessor: (u: any) => u.name },
    { header: "Email", accessor: (u: any) => u.email },
    { header: "Role", accessor: (u: any) => <Badge color="blue">{u.role}</Badge> },
    { header: "Status", accessor: (u: any) => <Badge color={u.isActive ? "green" : "red"}>{u.isActive ? "Active" : "Inactive"}</Badge> },
    {
      header: "Actions",
      accessor: (u: any) =>
        u.isActive ? (
          <button className="text-sm font-medium text-red-600 hover:underline" onClick={() => deactivateMutation.mutate(u.id)}>
            Deactivate
          </button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Staff Accounts</h2>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} rowKey={(u: any) => u.id} emptyMessage="No users found" />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Staff Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting || createMutation.isPending} onClick={handleSubmit((v) => createMutation.mutate(v))}>
              Create
            </Button>
          </>
        }
      >
        <form className="space-y-3">
          <Input label="Name" error={errors.name?.message} {...register("name", { required: "Required" })} />
          <Input label="Email" type="email" error={errors.email?.message} {...register("email", { required: "Required" })} />
          <Input label="Password" type="password" error={errors.password?.message} {...register("password", { required: "Required", minLength: { value: 8, message: "At least 8 characters" } })} />
          <Select label="Role" {...register("role", { required: true })}>
            <option value="ADMIN">Admin</option>
            <option value="SALES">Sales</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="ACCOUNTS">Accounts</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}
