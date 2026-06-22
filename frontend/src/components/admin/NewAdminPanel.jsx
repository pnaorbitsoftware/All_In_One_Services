import { useState, useEffect, useRef } from "react";
import { releaseProviderPayment } from "../../api/payments";
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
  TrendingUp,
  Award,
  Eye,
  Send,
  LogOut,
  FolderOpen,
  LifeBuoy,
  Paperclip,
  AlertCircle,
  FileText,
  Search,
  Loader2,
  User,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function NewAdminPanel({
  adminData,
  paymentData,
  updateProviderApproval,
  updateBookingRequest,
  setAdminData,
  refreshAdminContactMessages,
  setStatusMessage,
  refreshAdminPayments,
  setIsAdminMode,
}) {
  // State declarations
  const [selectedProviders, setSelectedProviders] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all_bookings");
  const [activeDrawerProvider, setActiveDrawerProvider] = useState(null);

  // Helpdesk Ticketing States
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportAnalytics, setSupportAnalytics] = useState(null);
  const [supportStaff, setSupportStaff] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [ticketReplyAttachment, setTicketReplyAttachment] = useState(null);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  // Filters for Helpdesk Queue
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All");
  const [ticketRoleFilter, setTicketRoleFilter] = useState("All");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("All");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("All");
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");

  const ticketMessagesEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === "support" && ticketMessagesEndRef.current) {
      ticketMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticketMessages, activeTab]);

  const fetchSupportTickets = async () => {
    setSupportLoading(true);
    try {
      const token = localStorage.getItem("servicehub_token");
      const url = new URL(`${API_URL}/support/tickets`);
      url.searchParams.append("status", ticketStatusFilter);
      url.searchParams.append("role", ticketRoleFilter);
      url.searchParams.append("category", ticketCategoryFilter);
      url.searchParams.append("priority", ticketPriorityFilter);
      url.searchParams.append("search", ticketSearchQuery);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupportTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage?.("Could not fetch support tickets.");
    } finally {
      setSupportLoading(false);
    }
  };

  const fetchSupportAnalytics = async () => {
    try {
      const token = localStorage.getItem("servicehub_token");
      const res = await fetch(`${API_URL}/support/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupportAnalytics(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSupportStaff = async () => {
    try {
      const token = localStorage.getItem("servicehub_token");
      const res = await fetch(`${API_URL}/support/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupportStaff(data.staff || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTicketDetails = async (ticketId) => {
    try {
      const token = localStorage.getItem("servicehub_token");
      const res = await fetch(`${API_URL}/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedTicket(data.ticket);
        setTicketMessages(data.messages || []);
      } else {
        setStatusMessage?.(data.message || "Failed to load ticket details.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage?.("Error fetching ticket details.");
    }
  };

  const handleTicketStatusChange = async (ticketId, nextStatus) => {
    try {
      const token = localStorage.getItem("servicehub_token");
      const res = await fetch(`${API_URL}/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedTicket(data.data);
        setStatusMessage?.(`Ticket status set to ${nextStatus}.`);
        fetchSupportTickets();
        fetchSupportAnalytics();
      } else {
        setStatusMessage?.(data.message || "Could not update status.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage?.("Server error updating status.");
    }
  };

  const handleTicketAssign = async (ticketId, staffId) => {
    try {
      const token = localStorage.getItem("servicehub_token");
      const res = await fetch(`${API_URL}/support/tickets/${ticketId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignedTo: staffId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedTicket(data.data);
        setStatusMessage?.("Ticket successfully assigned.");
        fetchSupportTickets();
      } else {
        setStatusMessage?.(data.message || "Could not assign ticket.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage?.("Server error assigning ticket.");
    }
  };

  const handleAdminFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage?.("File size exceeds 5MB limit.");
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      setStatusMessage?.("Unsupported file type. Use Images, PDF, Word, or TXT.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTicketReplyAttachment({ name: file.name, url: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReplyText.trim() && !ticketReplyAttachment) return;

    setReplyLoading(true);
    try {
      const token = localStorage.getItem("servicehub_token");
      const res = await fetch(`${API_URL}/support/tickets/${selectedTicket.ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: ticketReplyText,
          attachment: ticketReplyAttachment,
          isInternal: isInternalNote,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTicketMessages(prev => [...prev, data.data]);
        setTicketReplyText("");
        setTicketReplyAttachment(null);
        setStatusMessage?.(isInternalNote ? "Internal note added." : "Reply dispatched to user.");
        fetchSupportTickets();
      } else {
        setStatusMessage?.(data.message || "Failed to submit response.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage?.("Error connecting to support backend.");
    } finally {
      setReplyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "support") {
      const timer = window.setTimeout(() => {
        fetchSupportTickets();
        fetchSupportAnalytics();
        fetchSupportStaff();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [activeTab, ticketStatusFilter, ticketRoleFilter, ticketCategoryFilter, ticketPriorityFilter, ticketSearchQuery]);



  // Handle logout
  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Handle release payment
  const handleReleasePayment = async (bookingId) => {
    try {
      await releaseProviderPayment(bookingId);
      refreshAdminPayments?.();
      window.location.reload();
    } catch (error) {
      alert(error.message);
    }
  };

  // Calculate stats
  const stats = adminData?.stats || {};
  const bookingCount = adminData?.bookings?.length || 0;
  const providerCount = adminData?.providers?.length || 0;
  const totalRevenue =
    paymentData?.totalRevenue || stats.totalCostEstimate || 3588;
  const avgTicketSize =
    bookingCount > 0 ? (totalRevenue / bookingCount).toFixed(2) : 0;
  const completedBookingsCount = (adminData?.bookings || []).filter(
    (b) => b.status?.toLowerCase() === "completed",
  ).length;
  const fulfillmentRate =
    bookingCount > 0
      ? ((completedBookingsCount / bookingCount) * 100).toFixed(1)
      : 0;
  const approvedProvidersCount = (adminData?.providers || []).filter(
    (p) => p.approvalStatus?.toLowerCase() === "approved",
  ).length;
  const providerConversion =
    providerCount > 0
      ? ((approvedProvidersCount / providerCount) * 100).toFixed(1)
      : 0;

  // Calculate top services
  const calculateTopServices = () => {
    const counts = {};
    (adminData?.bookings || []).forEach((b) => {
      if (b.service) counts[b.service] = (counts[b.service] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  };

  const realTopServices = calculateTopServices();
  const leaderBoardProviders = [...(adminData?.providers || [])]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  // Menu items
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Bookings Queue", icon: CalendarDays },
    { id: "providers", label: "Providers Network", icon: Users },
    { id: "payments", label: "Settlements", icon: CreditCard },
    { id: "messages", label: "CRM Inbox", icon: MessageSquare },
    { id: "support", label: "Helpdesk Tickets", icon: LifeBuoy },
    { id: "analytics", label: "Analytics Dashboard", icon: BarChart3 },
    { id: "history", label: "Archive Vault", icon: History },
  ];

  // Handle send reply
  const handleSendReply = async (messageId) => {
    if (!replyText.trim()) return;
    try {
      if (setAdminData && adminData) {
        const updatedMessages = (adminData.contactMessages || []).map((msg) => {
          if (msg._id === messageId) {
            return {
              ...msg,
              replyLog: replyText,
              repliedAt: new Date().toISOString(),
            };
          }
          return msg;
        });
        setAdminData({ ...adminData, contactMessages: updatedMessages });
        if (setStatusMessage) setStatusMessage("Reply processed successfully!");
        setReplyText("");
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error(err);
      if (setStatusMessage) {
        setStatusMessage("Error syncing response.");
      }
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-100 flex overflow-hidden z-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside
        className={`bg-slate-950 text-white transition-all duration-300 flex flex-col h-full flex-shrink-0 z-30 shadow-xl ${sidebarOpen ? "w-72" : "w-20"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5 flex-shrink-0">
          {sidebarOpen && (
            <div>
              <h2 className="text-xl font-bold tracking-wide text-blue-500">
                ServiceHub
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                Admin Console
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-slate-800 p-2 rounded-xl transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left font-semibold text-sm transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="mt-auto border-t border-slate-700 pt-4 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-white font-semibold transition hover:bg-red-700"
          >
            <span>🚪</span>
            {sidebarOpen && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* TOP BAR */}
        <div className="h-20 border-b bg-white px-8 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight capitalize">
              {activeTab} Control Hub
            </h1>
            <p className="text-xs text-slate-500">
              Enterprise Operations Management
            </p>
          </div>
          {setIsAdminMode && (
            <button
              onClick={() => setIsAdminMode(false)}
              className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <LogOut size={14} />
              Exit Admin Mode
            </button>
          )}
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl p-6 bg-white border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total Users
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">
                      {stats.totalUsers || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={24} />
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Active Providers
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">
                      {stats.totalProviders || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Briefcase size={24} />
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total Bookings
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">
                      {stats.totalBookings || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <CalendarDays size={24} />
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Pending Work Queue
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">
                      {stats.pendingWork || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                    <Clock size={24} />
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Completed Deliveries
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">
                      {stats.completedWork || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle size={24} />
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                      Gross Pipeline Revenue
                    </p>
                    <h3 className="mt-2 text-2xl font-black">
                      ₹{totalRevenue}
                    </h3>
                  </div>
                  <div className="p-3 bg-white/10 text-white rounded-xl">
                    <IndianRupee size={24} />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Providers */}
                <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-100">
                  <h2 className="mb-4 text-lg font-bold text-slate-900">
                    Recent Onboarded Providers
                  </h2>
                  <div className="divide-y divide-slate-100">
                    {(adminData?.providers || [])
                      .slice(0, 5)
                      .map((provider) => (
                        <div
                          key={provider._id}
                          className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {provider.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {provider.category ||
                                provider.customCategory ||
                                "-"}
                            </p>
                          </div>
                          <span
                            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${provider.approvalStatus?.toLowerCase() === "approved" ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}
                          >
                            {provider.approvalStatus || "pending"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-100">
                  <h2 className="mb-4 text-lg font-bold text-slate-900">
                    Recent Service Requests
                  </h2>
                  <div className="divide-y divide-slate-100">
                    {(adminData?.bookings || []).slice(0, 5).map((booking) => (
                      <div
                        key={booking._id}
                        className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {booking.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {booking.service}
                          </p>
                        </div>
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${booking.status?.toLowerCase() === "completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {booking.status || "pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* BOOKINGS QUEUE TAB */}
          {activeTab === "bookings" && (
            <div className="rounded-2xl bg-white shadow-xs border border-slate-100 overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">
                  Active Bookings Queue
                </h2>
                <span className="bg-slate-200/80 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold">
                  Live Items: {bookingCount}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6 min-w-[100px] whitespace-nowrap">
                        Booking ID
                      </th>
                      <th className="p-4 min-w-[150px] whitespace-nowrap">
                        Customer
                      </th>
                      <th className="p-4 min-w-[130px] whitespace-nowrap">
                        Phone Node
                      </th>
                      <th className="p-4 min-w-[150px] whitespace-nowrap">
                        Service
                      </th>
                      <th className="p-4 min-w-[140px] whitespace-nowrap">
                        Assigned Pro
                      </th>
                      <th className="p-4 min-w-[220px] whitespace-nowrap">
                        Assign Provider
                      </th>
                      <th className="p-4 min-w-[100px] whitespace-nowrap">
                        Amount
                      </th>
                      <th className="p-4 min-w-[120px] whitespace-nowrap">
                        Live Status
                      </th>
                      <th className="p-4 min-w-[110px] whitespace-nowrap">
                        Date
                      </th>
                      <th className="p-4 pr-6 text-center min-w-[180px]">
                        Operational Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {(adminData?.bookings || []).map((booking) => {
                      const cleanStatus =
                        booking.status?.toLowerCase() || "pending";
                      return (
                        <tr
                          key={booking._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-4 pl-6 font-mono text-xs text-slate-400 whitespace-nowrap">
                            {booking._id ? booking._id.slice(-6) : "-"}
                          </td>
                          <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                            {booking.name || "-"}
                          </td>
                          <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                            {booking.phone || "-"}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="inline-block bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg">
                              {booking.service || "-"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-700 font-semibold whitespace-nowrap">
                            {booking.assignedProviderName ||
                              booking.requestedProviderName ||
                              "Not Assigned"}
                          </td>
                          <td className="p-4">
                            <select
                              value={selectedProviders[booking._id] || ""}
                              onChange={(e) =>
                                setSelectedProviders((prev) => ({
                                  ...prev,
                                  [booking._id]: e.target.value,
                                }))
                              }
                              disabled={cleanStatus === "completed"}
                              className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs bg-white disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-700"
                            >
                              <option value="">Select Provider</option>
                              {(adminData?.providers || [])
                                .filter(
                                  (provider) =>
                                    provider.approvalStatus?.toLowerCase() ===
                                    "approved",
                                )
                                .map((provider) => (
                                  <option
                                    key={provider._id}
                                    value={provider._id}
                                  >
                                    {provider.businessName || provider.name}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="p-4 font-extrabold text-emerald-600 whitespace-nowrap">
                            ₹
                            {booking.finalEstimateAmount || booking.amount || 0}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span
                              className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${cleanStatus === "completed" ? "bg-green-50 text-green-700 border border-green-200" : cleanStatus === "accepted" || cleanStatus === "job_started" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                            >
                              {booking.status || "pending"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                            {booking.preferredDate
                              ? new Date(
                                  booking.preferredDate,
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="p-4 pr-6 text-center whitespace-nowrap">
                            <div className="flex justify-center items-center gap-2">
                              {selectedProviders[booking._id] &&
                                cleanStatus !== "completed" && (
                                  <button
                                    onClick={() =>
                                      updateBookingRequest(booking._id, {
                                        providerId:
                                          selectedProviders[booking._id],
                                        status: "assigned",
                                      })
                                    }
                                    className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition flex-shrink-0"
                                  >
                                    Assign
                                  </button>
                                )}
                              {cleanStatus !== "accepted" &&
                                cleanStatus !== "completed" &&
                                cleanStatus !== "job_started" && (
                                  <button
                                    onClick={() =>
                                      updateBookingRequest(booking._id, {
                                        status: "accepted",
                                      })
                                    }
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition flex-shrink-0"
                                  >
                                    Accept
                                  </button>
                                )}
                              {cleanStatus !== "completed" && (
                                <button
                                  onClick={() =>
                                    updateBookingRequest(booking._id, {
                                      status: "completed",
                                    })
                                  }
                                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition flex-shrink-0"
                                >
                                  Complete
                                </button>
                              )}
                              {cleanStatus === "completed" && (
                                <span className="text-xs text-slate-400 font-medium italic">
                                  Archived Stack
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROVIDERS NETWORK TAB */}
          {activeTab === "providers" && (
            <div className="rounded-2xl bg-white shadow-xs border border-slate-100 overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">
                  Provider Control Matrix
                </h2>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">
                  Total Network: {providerCount}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6 min-w-[90px] whitespace-nowrap">
                        Photo
                      </th>
                      <th className="p-4 min-w-[150px] whitespace-nowrap">
                        Operator Name
                      </th>
                      <th className="p-4 min-w-[160px] whitespace-nowrap">
                        Core Category
                      </th>
                      <th className="p-4 min-w-[145px] whitespace-nowrap">
                        Phone
                      </th>
                      <th className="p-4 min-w-[120px] whitespace-nowrap">
                        Location Hub
                      </th>
                      <th className="p-4 min-w-[110px] whitespace-nowrap">
                        Trust Metric
                      </th>
                      <th className="p-4 min-w-[120px] whitespace-nowrap">
                        Verification
                      </th>
                      <th className="p-4 pr-6 text-center min-w-[160px] whitespace-nowrap">
                        System Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {(adminData?.providers || []).map((provider) => {
                      const cleanAppStatus =
                        provider.approvalStatus?.toLowerCase() || "pending";
                      return (
                        <tr
                          key={provider._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-4 pl-6 whitespace-nowrap">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0">
                              <img
                                src={
                                  provider.profileImage ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name || "Pro")}&background=random`
                                }
                                className="h-full w-full object-cover"
                                alt="Pro"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name || "Pro")}&background=random`;
                                }}
                              />
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                            {provider.name}
                          </td>
                          <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                            {provider.category ||
                              provider.customCategory ||
                              "-"}
                          </td>
                          <td className="p-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {provider.phone}
                          </td>
                          <td className="p-4 text-slate-500 whitespace-nowrap capitalize">
                            {provider.preferredWorkLocation || "MIDC"}
                          </td>
                          <td className="p-4 font-bold text-amber-500 whitespace-nowrap">
                            ⭐ {provider.rating || 0}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span
                              className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cleanAppStatus === "approved" ? "bg-green-50 text-green-700 border border-green-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
                            >
                              {provider.approvalStatus || "pending"}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-center whitespace-nowrap">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() =>
                                  setActiveDrawerProvider(provider)
                                }
                                className="bg-slate-100 p-2 rounded-xl text-slate-600 hover:bg-slate-200 transition flex-shrink-0"
                              >
                                <Eye size={14} />
                              </button>
                              {cleanAppStatus === "pending" && (
                                <button
                                  onClick={() =>
                                    updateProviderApproval(
                                      provider._id,
                                      "approved",
                                    )
                                  }
                                  className="bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition flex-shrink-0"
                                >
                                  Approve
                                </button>
                              )}
                              {cleanAppStatus === "approved" && (
                                <button
                                  onClick={() =>
                                    updateProviderApproval(
                                      provider._id,
                                      "rejected",
                                    )
                                  }
                                  className="whitespace-nowrap bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-rose-50 hover:text-rose-600 transition border border-slate-200 flex-shrink-0"
                                >
                                  Suspend
                                </button>
                              )}
                              {cleanAppStatus === "rejected" && (
                                <button
                                  onClick={() =>
                                    updateProviderApproval(
                                      provider._id,
                                      "approved",
                                    )
                                  }
                                  className="whitespace-nowrap bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition flex-shrink-0"
                                >
                                  Re-Approve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAYMENTS TAB - UPDATED WITH PROVIDER PAYOUT SUMMARY */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">
                  Settlements Ledger
                </h2>
                <button
                  onClick={refreshAdminPayments}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition shadow-xs"
                >
                  Force Sync Logs
                </button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-xs">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Gross Capital Pipeline
                  </p>
                  <h3 className="text-2xl font-black mt-2 text-slate-950">
                    ₹{totalRevenue}
                  </h3>
                </div>
                <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-xs">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Provider Share (80%)
                  </p>
                  <h3 className="text-2xl font-black mt-2 text-emerald-600">
                    ₹{(totalRevenue * 0.8).toFixed(0)}
                  </h3>
                </div>
                <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-xs">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Platform overhead (20%)
                  </p>
                  <h3 className="text-2xl font-black mt-2 text-blue-600">
                    ₹{(totalRevenue * 0.2).toFixed(0)}
                  </h3>
                </div>
                <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-xs">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Escrow Clearing
                  </p>
                  <h3 className="text-2xl font-black mt-2 text-amber-500">
                    ₹0
                  </h3>
                </div>
              </div>

              {/* Provider Payout Summary - Replaced Audit Trail Ledger */}
              <div className="rounded-2xl bg-white shadow-xs border border-slate-100 overflow-hidden">
                <div className="p-5 border-b bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Provider Payout Summary
                  </h3>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border p-4">
                      <p className="text-xs text-slate-500">
                        Released Payments
                      </p>
                      <h3 className="text-xl font-bold text-green-600">
                        {
                          adminData?.bookings?.filter(
                            (b) => b.providerPaymentReleased,
                          ).length
                        }
                      </h3>
                    </div>

                    <div className="rounded-xl border p-4">
                      <p className="text-xs text-slate-500">Pending Payments</p>
                      <h3 className="text-xl font-bold text-amber-600">
                        {
                          adminData?.bookings?.filter(
                            (b) =>
                              b.status?.toLowerCase() === "completed" &&
                              !b.providerPaymentReleased,
                          ).length
                        }
                      </h3>
                    </div>

                    <div className="rounded-xl border p-4">
                      <p className="text-xs text-slate-500">Completed Jobs</p>
                      <h3 className="text-xl font-bold text-blue-600">
                        {
                          adminData?.bookings?.filter(
                            (b) => b.status?.toLowerCase() === "completed",
                          ).length
                        }
                      </h3>
                    </div>

                    <div className="rounded-xl border p-4">
                      <p className="text-xs text-slate-500">
                        Platform Earnings
                      </p>
                      <h3 className="text-xl font-bold text-purple-600">
                        ₹{(totalRevenue * 0.2).toFixed(0)}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MESSAGES CRM INBOX */}
          {activeTab === "messages" && (
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex h-[580px]">
              <div className="w-1/3 border-r flex flex-col bg-slate-50/40 flex-shrink-0">
                <div className="p-4 border-b bg-white flex items-center justify-between flex-shrink-0">
                  <h3 className="font-bold text-slate-900 text-sm">
                    CRM Inbound Feed
                  </h3>
                  <button
                    onClick={refreshAdminContactMessages}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Sync
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {(adminData?.contactMessages || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No Live Feedback Feed
                    </div>
                  ) : (
                    (adminData?.contactMessages || []).map((msg) => (
                      <div
                        key={msg._id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`p-4 cursor-pointer transition-all ${selectedMessage?._id === msg._id ? "bg-blue-50/60 border-l-4 border-blue-600" : "bg-white hover:bg-slate-50/50"}`}
                      >
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {msg.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {msg.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col bg-slate-50/30">
                {selectedMessage ? (
                  <div className="flex flex-col h-full bg-white">
                    <div className="p-4 border-b bg-slate-50/40 flex-shrink-0">
                      <h3 className="font-bold text-slate-900">
                        {selectedMessage.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedMessage.email}
                      </p>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 max-w-xl">
                        <p className="text-slate-800 text-sm whitespace-pre-line leading-relaxed">
                          {selectedMessage.message}
                        </p>
                      </div>
                      {selectedMessage.replyLog && (
                        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 max-w-xl ml-auto">
                          <p className="text-slate-900 text-sm font-medium whitespace-pre-line">
                            {selectedMessage.replyLog}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t flex gap-3 items-end flex-shrink-0 bg-white">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type official response here..."
                        className="flex-1 border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 h-20 resize-none"
                      />
                      <button
                        onClick={() => handleSendReply(selectedMessage._id)}
                        disabled={!replyText.trim()}
                        className="bg-blue-600 text-white p-3 rounded-xl disabled:opacity-40 transition-all shadow-md"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare size={36} className="mb-2 stroke-1" />
                    <p className="text-xs font-bold uppercase tracking-wider">
                      CRM Terminal Empty
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Avg Basket Scale
                    </p>
                    <h4 className="text-xl font-black text-slate-900">
                      ₹{avgTicketSize}
                    </h4>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <Award size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Job Fulfillment
                    </p>
                    <h4 className="text-xl font-black text-slate-900">
                      {fulfillmentRate}%
                    </h4>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Operator Conversion
                    </p>
                    <h4 className="text-xl font-black text-slate-900">
                      {providerConversion}%
                    </h4>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-5">
                    Top Volume Service Sectors
                  </h3>
                  <div className="space-y-4.5">
                    {realTopServices.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No historical nodes to render graphs.
                      </p>
                    ) : (
                      realTopServices.map((svc) => {
                        const percentage =
                          bookingCount > 0
                            ? ((svc.value / bookingCount) * 100).toFixed(0)
                            : 0;
                        return (
                          <div key={svc.name}>
                            <div className="flex justify-between text-xs mb-1.5 font-bold">
                              <span className="text-slate-700">{svc.name}</span>
                              <span className="text-slate-900">
                                {svc.value} Capture Requests ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-5">
                    Network Operator Leaderboards
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {leaderBoardProviders.map((p, index) => (
                      <div
                        key={p._id || index}
                        className="py-3 flex justify-between items-center last:pb-0 first:pt-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400">
                            #0{index + 1}
                          </span>
                          <p className="font-bold text-xs text-slate-900 whitespace-nowrap">
                            {p.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-amber-500 whitespace-nowrap">
                            ⭐ {p.rating || "5.0"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                            {p.category || "Operator"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HELPDESK TICKETS TAB */}
          {activeTab === "support" && (
            <div className="space-y-6">
              {/* Analytics Summary */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  {
                    label: "Total Tickets",
                    value: supportAnalytics?.total ?? 0,
                    icon: LifeBuoy,
                    color: "text-slate-600 bg-slate-100",
                  },
                  {
                    label: "Open Tickets",
                    value: supportAnalytics?.open ?? 0,
                    icon: AlertCircle,
                    color: "text-blue-600 bg-blue-50",
                  },
                  {
                    label: "In Progress",
                    value: supportAnalytics?.inProgress ?? 0,
                    icon: Clock,
                    color: "text-amber-600 bg-amber-50",
                  },
                  {
                    label: "Resolved",
                    value: supportAnalytics?.resolved ?? 0,
                    icon: CheckCircle,
                    color: "text-emerald-600 bg-emerald-50",
                  },
                  {
                    label: "Closed",
                    value: supportAnalytics?.closed ?? 0,
                    icon: AlertCircle,
                    color: "text-slate-600 bg-slate-100",
                  },
                ].map((stat, idx) => (
                  <div key={idx} className="rounded-2xl p-5 bg-white border border-slate-100 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      <h3 className="mt-1.5 text-xl font-black text-slate-900">{stat.value}</h3>
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Ticket Interface */}
              <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex h-[620px]">
                {/* Left Ticket Queue Sidebar */}
                <div className="w-1/3 border-r flex flex-col bg-slate-50/30 flex-shrink-0">
                  {/* Search & Filters */}
                  <div className="p-4 border-b bg-white space-y-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm">Helpdesk Queue</h3>
                      <button
                        onClick={() => {
                          fetchSupportTickets();
                          fetchSupportAnalytics();
                        }}
                        className="text-[11px] text-blue-600 font-bold hover:underline"
                      >
                        Sync Queue
                      </button>
                    </div>

                    <div className="relative font-sans">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        placeholder="Search ID, subject, email..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-[11px] text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition placeholder-slate-400 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      <select
                        value={ticketStatusFilter}
                        onChange={(e) => setTicketStatusFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-1 font-bold text-slate-700 outline-none"
                      >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>

                      <select
                        value={ticketRoleFilter}
                        onChange={(e) => setTicketRoleFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-1 font-bold text-slate-700 outline-none"
                      >
                        <option value="All">All Roles</option>
                        <option value="user">Users</option>
                        <option value="provider">Providers</option>
                      </select>

                      <select
                        value={ticketCategoryFilter}
                        onChange={(e) => setTicketCategoryFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-1 font-bold text-slate-700 outline-none"
                      >
                        <option value="All">All Categories</option>
                        <option value="Payment Issue">Payment</option>
                        <option value="Service Issue">Service</option>
                        <option value="Account Issue">Account</option>
                        <option value="Technical Issue">Technical</option>
                        <option value="Other">Other</option>
                      </select>

                      <select
                        value={ticketPriorityFilter}
                        onChange={(e) => setTicketPriorityFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-1 font-bold text-slate-700 outline-none"
                      >
                        <option value="All">All Priority</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Queue Scrollable View */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {supportLoading ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        Fetching Queue...
                      </div>
                    ) : supportTickets.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                        No support tickets match these filters.
                      </div>
                    ) : (
                      supportTickets.map((t) => (
                        <div
                          key={t.ticketId}
                          onClick={() => loadTicketDetails(t.ticketId)}
                          className={`p-4 hover:bg-slate-50 transition cursor-pointer text-left ${
                            selectedTicket?.ticketId === t.ticketId ? "bg-blue-50/50 hover:bg-blue-50/50 border-l-4 border-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.ticketId}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                t.priority === "High"
                                  ? "bg-orange-50 text-orange-500 border-orange-100"
                                  : "bg-slate-50 text-slate-500 border-slate-100"
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1 mb-1">{t.subject || t.category}</h4>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mt-2">
                            <span>By: {t.userName}</span>
                            <span className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] ${
                              t.status === "Resolved"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : t.status === "Closed"
                                ? "bg-slate-100 text-slate-500"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}>{t.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Details & Conversation Panel */}
                <div className="w-2/3 flex flex-col bg-white">
                  {selectedTicket ? (
                    <div className="flex flex-col h-full">
                      {/* Ticket Details Header */}
                      <div className="p-5 border-b bg-slate-50/40 flex-shrink-0 flex items-start justify-between gap-4">
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase">{selectedTicket.ticketId}</span>
                            {selectedTicket.bookingId && (
                              <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border">
                                Booking: {selectedTicket.bookingId}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-black text-slate-900 mt-1 leading-snug">{selectedTicket.subject || selectedTicket.category}</h3>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                            Cat: {selectedTicket.category} • Priority: {selectedTicket.priority} • Role: {selectedTicket.requesterRole || selectedTicket.role} • {selectedTicket.userName} ({selectedTicket.userEmail}) {selectedTicket.userPhone ? `• ${selectedTicket.userPhone}` : ""}
                          </p>
                        </div>

                        {/* Dropdown controls (Assign & Status) */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-slate-400 w-16 text-right">Assignee:</span>
                            <select
                              value={selectedTicket.assignedTo || ""}
                              onChange={(e) => handleTicketAssign(selectedTicket.ticketId, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 text-[11px] font-bold outline-none focus:border-blue-500 w-44"
                            >
                              <option value="">Unassigned</option>
                              {supportStaff.map((staff) => (
                                <option key={staff._id} value={staff._id}>
                                  {staff.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-slate-400 w-16 text-right">Status:</span>
                            <select
                              value={selectedTicket.status}
                              onChange={(e) => handleTicketStatusChange(selectedTicket.ticketId, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 text-[11px] font-bold outline-none focus:border-blue-500 w-44"
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Message Thread view */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
                        {/* Original ticket details card */}
                        <div className="p-4 rounded-xl bg-slate-50 border text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-slate-600">
                              <User size={12} />
                            </div>
                            <div>
                              <span className="text-[11px] font-black text-slate-800">{selectedTicket.userName}</span>
                              <span className="text-[9px] text-slate-400 font-bold ml-2">CREATED TICKETS</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium white-space: pre-wrap;">
                            {selectedTicket.description}
                          </p>

                          {/* Original attachments */}
                          {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                            <div className="mt-3.5 grid grid-cols-2 gap-2">
                              {selectedTicket.attachments.map((file, idx) => (
                                <a
                                  key={idx}
                                  href={file.url}
                                  download={file.name}
                                  className="flex items-center gap-2 p-2 border bg-white hover:bg-slate-50 rounded-xl transition text-left"
                                >
                                  <FileText className="h-4 w-4 text-pink-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-slate-700 truncate">{file.name}</p>
                                    <p className="text-[8px] text-blue-500 font-black tracking-wider uppercase">Download File</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Thread messages list */}
                        {ticketMessages.map((msg, index) => {
                          const isInternal = msg.senderRole === "internal";
                          const isUser = msg.senderRole === "user";
                          const isProvider = msg.senderRole === "provider";
                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-xl border text-left ${
                                isInternal
                                  ? "bg-amber-50/80 border-amber-200 text-amber-900 shadow-xs"
                                  : isUser || isProvider
                                  ? "bg-white border-slate-100"
                                  : "bg-blue-50/30 border-blue-100"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`grid h-6 w-6 place-items-center rounded-full border ${
                                      isUser || isProvider
                                        ? "bg-slate-100 border-slate-200 text-slate-600"
                                        : isInternal
                                        ? "bg-amber-200/50 border-amber-300 text-amber-700"
                                        : "bg-blue-100 border-blue-200 text-blue-700"
                                    }`}
                                  >
                                    {isUser || isProvider ? <User size={12} /> : <LifeBuoy size={12} />}
                                  </div>
                                  <div>
                                    <span className="text-[11px] font-black text-slate-800">{msg.senderId?.name || "Support desk"}</span>
                                    <span
                                      className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-2 ${
                                        isInternal
                                          ? "bg-amber-200 text-amber-800"
                                          : isUser || isProvider
                                          ? "bg-slate-100 text-slate-600"
                                          : "bg-blue-100 text-blue-800"
                                      }`}
                                    >
                                      {isInternal ? "Internal Note" : isProvider ? "Provider" : isUser ? "User" : "Support Desk"}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-slate-400 font-semibold">
                                  {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap text-xs text-slate-600 leading-relaxed font-medium">
                                {msg.message}
                              </p>

                              {/* Message attachment */}
                              {msg.attachment && msg.attachment.url && (
                                <div className="mt-3.5">
                                  <a
                                    href={msg.attachment.url}
                                    download={msg.attachment.name}
                                    className="inline-flex items-center gap-2 p-2 border bg-white hover:bg-slate-50 rounded-xl transition text-left max-w-sm"
                                  >
                                    <FileText className="h-4 w-4 text-pink-500 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-bold text-slate-700 truncate">{msg.attachment.name}</p>
                                      <p className="text-[8px] text-blue-500 font-black tracking-wider uppercase">Download File</p>
                                    </div>
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div ref={ticketMessagesEndRef} />
                      </div>

                      {/* Reply Form */}
                      <form onSubmit={handleSendTicketReply} className="p-4 border-t bg-slate-50/50 flex-shrink-0 text-left">
                        {ticketReplyAttachment && (
                          <div className="mb-2 flex items-center justify-between text-xs px-2.5 py-1.5 bg-white rounded-xl border">
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                              <Paperclip size={14} className="text-pink-500" />
                              {ticketReplyAttachment.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setTicketReplyAttachment(null)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <label className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 cursor-pointer transition flex-shrink-0">
                            <Paperclip size={16} />
                            <input type="file" className="hidden" onChange={handleAdminFileChange} />
                          </label>

                          <input
                            type="text"
                            value={ticketReplyText}
                            onChange={(e) => setTicketReplyText(e.target.value)}
                            placeholder={isInternalNote ? "Write an internal team note..." : "Respond to the client..."}
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 transition"
                          />

                          <button
                            type="submit"
                            disabled={replyLoading || (!ticketReplyText.trim() && !ticketReplyAttachment)}
                            className={`flex items-center gap-1.5 px-4 rounded-xl text-xs font-black text-white disabled:opacity-45 transition flex-shrink-0 ${
                              isInternalNote ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            {replyLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <>
                                <Send size={12} /> {isInternalNote ? "Add Note" : "Send Reply"}
                              </>
                            )}
                          </button>
                        </div>

                        {/* Internal Note Checkbox */}
                        <div className="mt-3.5 flex items-center gap-2 text-xs font-bold text-slate-500 select-none">
                          <input
                            type="checkbox"
                            id="internalNoteCheckbox"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="internalNoteCheckbox" className="cursor-pointer">
                            Mark as Internal Note (Only visible to support agents)
                          </label>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-xs font-bold">
                      <LifeBuoy className="h-12 w-12 text-slate-300 mb-3 animate-bounce" />
                      Select a support ticket from the queue list to review thread.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HISTORY ARCHIVE TAB */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Encrypted Data Archive
                  </h2>
                  <p className="text-xs text-slate-500">
                    Historical immutable audit logs
                  </p>
                </div>
                <div className="flex gap-1 bg-slate-200 p-1 rounded-xl text-xs font-bold shadow-xs">
                  <button
                    onClick={() => setHistoryFilter("all_bookings")}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${historyFilter === "all_bookings" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setHistoryFilter("cancelled_bookings")}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${historyFilter === "cancelled_bookings" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-100 min-h-[300px]">
                {historyFilter === "all_bookings" && (
                  <div className="overflow-x-auto">
                    <h3 className="font-bold text-sm mb-5 text-emerald-700 flex items-center gap-2 tracking-wide uppercase">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      Archive Stack: Settled Deliveries
                    </h3>
                    {!adminData?.bookings ||
                    adminData.bookings.filter(
                      (b) => b.status?.toLowerCase() === "completed",
                    ).length === 0 ? (
                      <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-3">
                        <FolderOpen
                          size={36}
                          className="stroke-1 text-slate-300"
                        />
                        <p className="text-xs font-bold uppercase tracking-wider">
                          No Settled Records in Vault
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                            <th className="p-4 pl-5 min-w-[200px] whitespace-nowrap">
                              Customer
                            </th>
                            <th className="p-4 min-w-[25px] whitespace-nowrap">
                              Service Sector
                            </th>
                            <th className="p-4 pr-5 text-right min-w-[150px] whitespace-nowrap">
                              Pipeline Amount
                            </th>
                            <th className="p-4 text-center whitespace-nowrap">
                              Payment Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adminData.bookings
                            .filter(
                              (b) => b.status?.toLowerCase() === "completed",
                            )
                            .map((b) => (
                              <tr
                                key={b._id}
                                className="hover:bg-slate-50/60 transition-colors"
                              >
                                <td className="p-4 pl-5 font-bold text-slate-900 whitespace-nowrap">
                                  {b.name || "Anonymous User"}
                                </td>
                                <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
                                    {b.service || "General Service"}
                                  </span>
                                </td>
                                <td className="p-4 pr-5 font-extrabold text-slate-900 text-right whitespace-nowrap">
                                  ₹{b.finalEstimateAmount || b.amount || 0}
                                </td>
                                <td className="p-4 text-center">
                                  {b.providerPaymentReleased ? (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold">
                                      Paid
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleReleasePayment(b._id)
                                      }
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition"
                                    >
                                      Release
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                {historyFilter === "cancelled_bookings" && (
                  <div className="overflow-x-auto">
                    <h3 className="font-bold text-sm mb-5 text-rose-700 flex items-center gap-2 tracking-wide uppercase">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block"></span>
                      Archive Stack: Terminated Requests
                    </h3>
                    {!adminData?.bookings ||
                    adminData.bookings.filter(
                      (b) =>
                        b.status?.toLowerCase() === "cancelled" ||
                        b.status?.toLowerCase() === "rejected",
                    ).length === 0 ? (
                      <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-3">
                        <FolderOpen
                          size={36}
                          className="stroke-1 text-slate-300"
                        />
                        <p className="text-xs font-bold uppercase tracking-wider">
                          No Terminated Logs in Vault
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                            <th className="p-4 pl-5 min-w-[200px] whitespace-nowrap">
                              Customer
                            </th>
                            <th className="p-4 min-w-[25px] whitespace-nowrap">
                              Service Sector
                            </th>
                            <th className="p-4 pr-5 text-right min-w-[150px] whitespace-nowrap">
                              Pipeline Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adminData.bookings
                            .filter(
                              (b) =>
                                b.status?.toLowerCase() === "cancelled" ||
                                b.status?.toLowerCase() === "rejected",
                            )
                            .map((b) => (
                              <tr
                                key={b._id}
                                className="hover:bg-slate-50/60 transition-colors"
                              >
                                <td className="p-4 pl-5 font-bold text-slate-400 line-through whitespace-nowrap">
                                  {b.name || "Anonymous User"}
                                </td>
                                <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                                  {b.service || "General Service"}
                                </td>
                                <td className="p-4 pr-5 font-bold text-rose-600 text-right whitespace-nowrap">
                                  ₹{b.finalEstimateAmount || b.amount || 0}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DRAWER BACKDROP */}
      {activeDrawerProvider && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={() => setActiveDrawerProvider(null)}
        />
      )}

      {/* OPERATOR DETAIL DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col transform transition-transform duration-300 ease-in-out ${activeDrawerProvider ? "translate-x-0" : "translate-x-full"}`}
      >
        {activeDrawerProvider && (
          <>
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Operator Profile Card
              </h3>
              <button
                onClick={() => setActiveDrawerProvider(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 border-b pb-6 mb-6">
              <img
                src={
                  activeDrawerProvider.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(activeDrawerProvider.name || "Pro")}&background=random`
                }
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 p-0.5 shadow-md"
                alt="Profile"
              />
              <h4 className="text-base font-bold text-slate-900">
                {activeDrawerProvider.name}
              </h4>
              <p className="text-xs text-blue-600 font-bold uppercase">
                {activeDrawerProvider.category || "Verified Node"}
              </p>
            </div>
            <div className="space-y-4 flex-1 text-sm">
              <p className="font-semibold text-slate-800">
                📞 {activeDrawerProvider.phone || "No Records"}
              </p>
              <p className="font-semibold text-slate-800">
                📧 {activeDrawerProvider.email || "No Email Attached"}
              </p>
              <p className="font-medium text-slate-700 capitalize">
                📍 Hub:{" "}
                {activeDrawerProvider.preferredWorkLocation || "MIDC Region"}
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    Trust Rating
                  </p>
                  <p className="text-base font-black text-slate-800">
                    ⭐ {activeDrawerProvider.rating || "5.0"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    Network Status
                  </p>
                  <span className="text-[10px] font-black text-green-700 uppercase bg-green-100 px-2 py-0.5 rounded">
                    {activeDrawerProvider.approvalStatus || "pending"}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t flex gap-3">
              <button
                onClick={() => {
                  updateProviderApproval(activeDrawerProvider._id, "approved");
                  setActiveDrawerProvider(null);
                }}
                className="flex-1 rounded-xl bg-green-600 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-green-700 transition"
              >
                Whitelist
              </button>
              <button
                onClick={() => {
                  updateProviderApproval(activeDrawerProvider._id, "rejected");
                  setActiveDrawerProvider(null);
                }}
                className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-red-700 transition"
              >
                Blacklist
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
