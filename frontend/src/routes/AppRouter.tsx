import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../layouts/ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import CustomerListPage from "../pages/customers/CustomerListPage";
import CustomerDetailPage from "../pages/customers/CustomerDetailPage";
import CustomerFormPage from "../pages/customers/CustomerFormPage";
import ProductListPage from "../pages/products/ProductListPage";
import ProductDetailPage from "../pages/products/ProductDetailPage";
import ProductFormPage from "../pages/products/ProductFormPage";
import InventoryPage from "../pages/inventory/InventoryPage";
import ChallanListPage from "../pages/challans/ChallanListPage";
import ChallanCreatePage from "../pages/challans/ChallanCreatePage";
import ChallanDetailPage from "../pages/challans/ChallanDetailPage";
import UserListPage from "../pages/users/UserListPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />

        <Route
          path="/customers"
          element={
            <ProtectedRoute roles={["ADMIN", "SALES", "ACCOUNTS"]}>
              <CustomerListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/new"
          element={
            <ProtectedRoute roles={["ADMIN", "SALES"]}>
              <CustomerFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute roles={["ADMIN", "SALES", "ACCOUNTS"]}>
              <CustomerDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id/edit"
          element={
            <ProtectedRoute roles={["ADMIN", "SALES"]}>
              <CustomerFormPage />
            </ProtectedRoute>
          }
        />

        <Route path="/products" element={<ProductListPage />} />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute roles={["ADMIN", "WAREHOUSE"]}>
              <ProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute roles={["ADMIN", "WAREHOUSE"]}>
              <ProductFormPage />
            </ProtectedRoute>
          }
        />

        <Route path="/inventory" element={<InventoryPage />} />

        <Route path="/challans" element={<ChallanListPage />} />
        <Route
          path="/challans/new"
          element={
            <ProtectedRoute roles={["ADMIN", "SALES"]}>
              <ChallanCreatePage />
            </ProtectedRoute>
          }
        />
        <Route path="/challans/:id" element={<ChallanDetailPage />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <UserListPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
