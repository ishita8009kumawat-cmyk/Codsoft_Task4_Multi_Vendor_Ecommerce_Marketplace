import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useCart } from "../CartContext";

const NAV = {
  admin: [
    { to: "/", label: "Overview", end: true },
    { to: "/vendors", label: "Vendors" },
    { to: "/categories", label: "Categories" },
    { to: "/orders", label: "All orders" },
  ],
  vendor: [
    { to: "/", label: "Overview", end: true },
    { to: "/products", label: "My products" },
    { to: "/orders", label: "Orders to fulfill" },
    { to: "/store", label: "Store profile" },
  ],
  customer: [
    { to: "/", label: "Overview", end: true },
    { to: "/shop", label: "Shop" },
    { to: "/orders", label: "My orders" },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const items = NAV[user.role] || [];

  return (
    <div className="flex min-h-screen bg-[var(--color-paper)]">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-[var(--color-ink)] text-white">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-violet-light)]">CodSoft Task 4</p>
          <h1 className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            MarketHub
          </h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-[var(--color-violet-light)]" : "text-white/75 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span>{item.label}</span>
              {item.to === "/shop" && user.role === "customer" && cart.count > 0 && (
                <span className="rounded-full bg-[var(--color-violet)] px-2 py-0.5 text-xs font-semibold text-white">
                  {cart.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs capitalize text-white/50">{user.role}</p>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="mt-3 w-full rounded-lg border border-white/15 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
