import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CreditCard,
  MessageSquare,
  History,
  BarChart3,
  Menu,
  X,
  Briefcase,
  Clock,
  CheckCircle,
  IndianRupee,
} from "lucide-react";

export default function NewAdminPanel({ adminData, paymentData }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const stats = adminData?.stats || {};

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: CalendarDays,
    },
    {
      id: "providers",
      label: "Providers",
      icon: Users,
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    {
      id: "history",
      label: "History",
      icon: History,
    },
  ];

  const statCards = [
    {
      title: "Users",
      value: stats.totalUsers || 0,
      icon: Users,
    },
    {
      title: "Providers",
      value: stats.totalProviders || 0,
      icon: Briefcase,
    },
    {
      title: "Bookings",
      value: stats.totalBookings || 0,
      icon: CalendarDays,
    },
    {
      title: "Pending Work",
      value: stats.pendingWork || 0,
      icon: Clock,
    },
    {
      title: "Completed",
      value: stats.completedWork || 0,
      icon: CheckCircle,
    },
    {
      title: "Revenue",
      value: `₹${stats.totalCostEstimate || 0}`,
      icon: IndianRupee,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* SIDEBAR */}

      <aside
        className={`bg-slate-950 text-white transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-20"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5">
          {sidebarOpen && (
            <div>
              <h2 className="text-xl font-bold">ServiceHub</h2>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          )}

          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className="p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon size={20} />

                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </aside>

      {/* MAIN */}

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">
              ServiceHub Admin
            </h1>

            <p className="mt-2 text-slate-500">Enterprise Management Console</p>
          </div>
        </div>

        {/* DASHBOARD */}

        {activeTab === "dashboard" && (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {statCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="rounded-3xl bg-white p-6 shadow-lg"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <Icon size={28} className="text-blue-600" />
                    </div>

                    <p className="text-slate-500">{card.title}</p>

                    <h3 className="mt-2 text-4xl font-bold text-slate-800">
                      {card.value}
                    </h3>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-2xl font-bold">Quick Summary</h2>

                <div className="space-y-3">
                  <p>
                    Providers :
                    <strong> {adminData?.providers?.length || 0}</strong>
                  </p>

                  <p>
                    Bookings :
                    <strong> {adminData?.bookings?.length || 0}</strong>
                  </p>

                  <p>
                    Users :<strong> {adminData?.users?.length || 0}</strong>
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-2xl font-bold">System Status</h2>

                <div className="space-y-3">
                  <p>🟢 Backend Connected</p>
                  <p>🟢 Providers Loaded</p>
                  <p>🟢 Bookings Loaded</p>
                  <p>🟢 Dashboard Active</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PLACEHOLDER PAGES */}

        {activeTab === "bookings" && (
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-3xl font-bold">Bookings Management</h2>
          </div>
        )}

        {activeTab === "providers" && (
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-3xl font-bold">Providers Management</h2>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-3xl font-bold">Payments Center</h2>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-3xl font-bold">Messages Center</h2>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          </div>
        )}

        {activeTab === "history" && (
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-3xl font-bold">History Center</h2>
          </div>
        )}
      </main>
    </div>
  );
}
