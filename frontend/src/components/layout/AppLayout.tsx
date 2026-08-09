import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/customers": "Customers",
  "/products": "Products",
  "/inventory": "Inventory",
  "/challans": "Sales Challans",
  "/users": "Users",
};

function resolveTitle(pathname: string) {
  const match = Object.keys(titleMap).find((key) => (key === "/" ? pathname === "/" : pathname.startsWith(key)));
  return match ? titleMap[match] : "Mini ERP + CRM";
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Topbar title={resolveTitle(location.pathname)} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
