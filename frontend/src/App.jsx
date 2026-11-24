import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { CartProvider } from "./CartContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Vendors from "./pages/admin/Vendors";
import Categories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/AdminOrders";

import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import StoreProfile from "./pages/vendor/StoreProfile";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import Shop from "./pages/customer/Shop";
import MyOrders from "./pages/customer/MyOrders";

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoutes() {
  const { user } = useAuth();

  if (user.role === "admin") {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (user.role === "vendor") {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="store" element={<StoreProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // customer
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CustomerDashboard />} />
        <Route path="shop" element={<Shop />} />
        <Route path="orders" element={<MyOrders />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <RoleRoutes />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}
