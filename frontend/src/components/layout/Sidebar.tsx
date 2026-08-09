import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  FileText,
  UserCog,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../types";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Customers", to: "/customers", icon: Users, roles: ["ADMIN", "SALES", "ACCOUNTS"] },
  { label: "Products", to: "/products", icon: Package },
  { label: "Inventory", to: "/inventory", icon: Boxes },
  { label: "Sales Challans", to: "/challans", icon: FileText },
  { label: "Users", to: "/users", icon: UserCog, roles: ["ADMIN"] },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();

  const visibleItems = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform
          lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Mini ERP + CRM</p>
            <p className="text-xs text-slate-400">Operations Portal</p>
          </div>
          <button onClick={onClose} className="text-slate-400 lg:hidden">
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
