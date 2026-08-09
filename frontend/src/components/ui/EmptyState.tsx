import { Inbox } from "lucide-react";
import { ReactNode } from "react";

export function EmptyState({ message = "Nothing here yet", action }: { message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-slate-500">
      <Inbox size={28} className="text-slate-300" />
      <p className="text-sm">{message}</p>
      {action}
    </div>
  );
}
