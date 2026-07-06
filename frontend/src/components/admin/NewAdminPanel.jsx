import { useState, useEffect, useMemo, useRef } from "react";
import { releaseProviderPayment } from "../../api/payments";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CreditCard,
  MessageSquare,
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
  LifeBuoy,
  Paperclip,
  AlertCircle,
  FileText,
  Loader2,
  Search,
  User,
  RefreshCw,
  Inbox,
  Download,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const formatDateTime = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const matchesSearch = (query, ...values) => {
  const cleanQuery = normalizeText(query);
  return (
    !cleanQuery ||
    values.some((value) => normalizeText(value).includes(cleanQuery))
  );
};

const documentLabel = (fallback, url, empty = "Not uploaded") => {
  if (fallback) return fallback;
  if (!url) return empty;
  if (/^data:application\/pdf/i.test(url) || /\.pdf(\?|#|$)/i.test(url)) {
    return "Aadhaar PDF uploaded";
  }
  return "Aadhaar image uploaded";
};

const openDocumentInNewTab = async ({ providerId, side, onError }) => {
  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    onError?.("Allow pop-ups to open the Aadhaar document.");
    return;
  }

  previewWindow.opener = null;
  previewWindow.document.title = "Loading Aadhaar document...";

  try {
    const token = localStorage.getItem("servicehub_token");
    const response = await fetch(`${API_URL}/admin/providers/${providerId}/aadhaar/${side}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Aadhaar document could not be loaded.");
    }

    const previewUrl = URL.createObjectURL(await response.blob());
    previewWindow.location.replace(previewUrl);
    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
  } catch (error) {
    previewWindow.close();
    onError?.(error.message || "Aadhaar document could not be loaded.");
  }
};

const downloadDocument = async ({ providerId, side, fileName, onError }) => {
  try {
    const token = localStorage.getItem("servicehub_token");
    const response = await fetch(`${API_URL}/admin/providers/${providerId}/aadhaar/${side}?download=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Aadhaar document could not be downloaded.");
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || `aadhaar-${side}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  } catch (error) {
    onError?.(error.message || "Aadhaar document could not be downloaded.");
  }
};

export default function NewAdminPanel({
  adminData,
  updateProviderApproval,
  updateBookingRequest,
  setAdminData,
  refreshAdminContactMessages,
  setStatusMessage,
  refreshAdminPayments,
  setIsAdminMode,
  onLogout,
}) {
  // State declarations
  const [selectedProviders, setSelectedProviders] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
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
  const [, setAnalyticsLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  // Filters for Helpdesk Queue
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("All");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("All");
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");

  // Operational list controls
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingServiceFilter, setBookingServiceFilter] = useState("all");
  const [providerSearch, setProviderSearch] = useState("");
  const [providerStatusFilter, setProviderStatusFilter] = useState("all");
  const [providerCategoryFilter, setProviderCategoryFilter] = useState("all");
  const [clientSearch, setClientSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [messageSearch, setMessageSearch] = useState("");

  const ticketMessagesEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === "support" && ticketMessagesEndRef.current) {
      ticketMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticketMessages, activeTab]);

  const fetchSupportTickets = async ({ silent = false } = {}) => {
    if (!silent) setSupportLoading(true);
    try {
      const token = localStorage.getItem("servicehub_token");
      const url = new URL(`${API_URL}/support/tickets`);
      url.searchParams.append("status", ticketStatusFilter);
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
      if (!silent) setSupportLoading(false);
    }
  };

  const fetchSupportAnalytics = async () => {
    setAnalyticsLoading(true);
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
    } finally {
      setAnalyticsLoading(false);
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

  const loadTicketDetails = async (ticketId, { force = false } = {}) => {
    if (selectedTicket?.ticketId === ticketId && !force) return;
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
      setStatusMessage?.(
        "Unsupported file type. Use Images, PDF, Word, or TXT.",
      );
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
      const res = await fetch(
        `${API_URL}/support/tickets/${selectedTicket.ticketId}/messages`,
        {
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
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setTicketMessages((prev) => [...prev, data.data]);
        setTicketReplyText("");
        setTicketReplyAttachment(null);
        setStatusMessage?.(
          isInternalNote ? "Internal note added." : "Reply dispatched to user.",
        );
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
      const timerId = window.setTimeout(() => {
        fetchSupportAnalytics();
        fetchSupportStaff();
      }, 0);
      return () => window.clearTimeout(timerId);
    }
    return undefined;
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "support") {
      const timerId = window.setTimeout(
        () => fetchSupportTickets(),
        ticketSearchQuery.trim() ? 300 : 0,
      );
      return () => window.clearTimeout(timerId);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    ticketStatusFilter,
    ticketCategoryFilter,
    ticketPriorityFilter,
    ticketSearchQuery,
  ]);

  useEffect(() => {
    if (activeTab !== "support") return undefined;

    const refreshSupport = () => {
      if (document.visibilityState !== "visible") return;
      fetchSupportTickets({ silent: true });
      if (selectedTicket?.ticketId) {
        loadTicketDetails(selectedTicket.ticketId, { force: true });
      }
    };
    const timerId = window.setInterval(refreshSupport, 15000);
    document.addEventListener("visibilitychange", refreshSupport);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", refreshSupport);
    };
    // Keep only the active support workspace live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedTicket?.ticketId]);

  // Handle logout
  const handleLogout = () => {
    onLogout?.();
  };

  // Handle release payment
  const handleReleasePayment = async (bookingId) => {
    try {
      await releaseProviderPayment(bookingId);
      await refreshAdminPayments?.();
      setStatusMessage?.("Provider payout released successfully.");
    } catch (error) {
      setStatusMessage?.(
        error.message || "Provider payout could not be released.",
      );
    }
  };

  // Calculate stats
  const stats = adminData?.stats || {};
  const bookingCount = adminData?.bookings?.length || 0;
  const providerCount = adminData?.providers?.length || 0;
  const totalUsersCount = Math.max(
    Number(stats.totalUsers) || 0,
    (adminData?.users || []).filter((account) => account.role === "user")
      .length,
  );
  const calculatedPendingBookings = (adminData?.bookings || []).filter(
    (booking) =>
      !["completed", "cancelled", "rejected"].includes(
        normalizeText(booking.status),
      ),
  ).length;
  const pendingBookingsCount = Math.max(
    Number(stats.pendingWork) || 0,
    calculatedPendingBookings,
  );
  const calculatedCompletedWork = (adminData?.bookings || []).filter(
    (booking) => normalizeText(booking.status) === "completed",
  ).length;
  const completedWorkCount = Math.max(
    Number(stats.completedWork) || 0,
    calculatedCompletedWork,
  );
  const calculatedRevenue = (adminData?.bookings || []).reduce(
    (total, booking) =>
      total +
      (Number(
        booking.finalEstimateAmount || booking.amount || booking.costEstimate,
      ) || 0),
    0,
  );
  const totalRevenue = Math.max(
    Number(stats.totalCostEstimate) || 0,
    calculatedRevenue,
  );
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

  const bookingServices = useMemo(
    () =>
      [
        ...new Set(
          (adminData?.bookings || [])
            .map((booking) => booking.service)
            .filter(Boolean),
        ),
      ].sort(),
    [adminData?.bookings],
  );
  const providerCategories = useMemo(
    () =>
      [
        ...new Set(
          (adminData?.providers || [])
            .map((provider) => provider.category || provider.customCategory)
            .filter(Boolean),
        ),
      ].sort(),
    [adminData?.providers],
  );
  const filteredBookings = (adminData?.bookings || []).filter((booking) => {
    const status = normalizeText(booking.status || "pending");
    return (
      (bookingStatusFilter === "all" || status === bookingStatusFilter) &&
      (bookingServiceFilter === "all" ||
        booking.service === bookingServiceFilter) &&
      matchesSearch(
        bookingSearch,
        booking._id,
        booking.bookingId,
        booking.name,
        booking.phone,
        booking.service,
        booking.assignedProviderName,
        booking.requestedProviderName,
      )
    );
  });
  const filteredProviders = (adminData?.providers || []).filter((provider) => {
    const status = normalizeText(provider.approvalStatus || "pending");
    const category = provider.category || provider.customCategory || "";
    return (
      (providerStatusFilter === "all" || status === providerStatusFilter) &&
      (providerCategoryFilter === "all" ||
        category === providerCategoryFilter) &&
      matchesSearch(
        providerSearch,
        provider.name,
        provider.businessName,
        provider.phone,
        provider.email,
        category,
        provider.preferredWorkLocation,
      )
    );
  });
  const payoutBookings = (adminData?.bookings || []).filter((booking) => {
    if (normalizeText(booking.status) !== "completed") return false;
    const releaseState = booking.providerPaymentReleased
      ? "released"
      : "pending";
    return (
      (paymentStatusFilter === "all" || paymentStatusFilter === releaseState) &&
      matchesSearch(
        paymentSearch,
        booking._id,
        booking.name,
        booking.service,
        booking.assignedProviderName,
        booking.requestedProviderName,
      )
    );
  });
  const filteredClients = (adminData?.users || []).filter((client) =>
    matchesSearch(
      clientSearch,
      client.name,
      client.email,
      client.phone,
      client.address,
    ),
  );
  const getClientBookingStats = (client) => {
    const clientBookings = (adminData?.bookings || []).filter(
      (booking) =>
        normalizeText(booking.userEmail) === normalizeText(client.email) ||
        normalizeText(booking.phone) === normalizeText(client.phone) ||
        normalizeText(booking.name) === normalizeText(client.name),
    );
    return {
      total: clientBookings.length,
      active: clientBookings.filter(
        (booking) =>
          !["completed", "cancelled"].includes(normalizeText(booking.status)),
      ).length,
      completed: clientBookings.filter(
        (booking) => normalizeText(booking.status) === "completed",
      ).length,
      cancelled: clientBookings.filter(
        (booking) => normalizeText(booking.status) === "cancelled",
      ).length,
      spend: clientBookings.reduce(
        (total, booking) =>
          total +
          (Number(
            booking.finalEstimateAmount || booking.amount || booking.costEstimate,
          ) || 0),
        0,
      ),
    };
  };
  const allCompletedPayouts = (adminData?.bookings || []).filter(
    (booking) => normalizeText(booking.status) === "completed",
  );
  const pendingPayoutValue = allCompletedPayouts
    .filter((booking) => !booking.providerPaymentReleased)
    .reduce(
      (total, booking) =>
        total +
        (Number(booking.finalEstimateAmount || booking.amount) || 0) * 0.8,
      0,
    );
  const filteredMessages = (adminData?.contactMessages || []).filter(
    (message) =>
      matchesSearch(
        messageSearch,
        message.name,
        message.email,
        message.phone,
        message.subject,
        message.message,
        message.adminReply,
      ),
  );
  const visibleSupportSummary = {
    total: supportTickets.length,
    open: supportTickets.filter(
      (ticket) => !["Resolved", "Closed"].includes(ticket.status),
    ).length,
    resolved: supportTickets.filter((ticket) =>
      ["Resolved", "Closed"].includes(ticket.status),
    ).length,
    highPriority: supportTickets.filter((ticket) =>
      ["High", "Urgent"].includes(ticket.priority),
    ).length,
  };

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

  // Menu items - Removed "history" tab
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      title: "Operations Overview",
      description: "Live marketplace health and today's operational priorities",
      icon: LayoutDashboard,
    },
    {
      id: "bookings",
      label: "Bookings Queue",
      title: "Booking Operations",
      description: "Assign providers and manage every service request",
      icon: CalendarDays,
    },
    {
      id: "providers",
      label: "Providers Network",
      title: "Provider Network",
      description: "Review, approve and manage service professionals",
      icon: Users,
    },
    {
      id: "clients",
      label: "Client Network",
      title: "Client Network",
      description: "Review client accounts, spend and booking history",
      icon: User,
    },
    {
      id: "payments",
      label: "Settlements",
      title: "Payments & Settlements",
      description: "Track collections, provider payouts and platform revenue",
      icon: CreditCard,
    },
    {
      id: "messages",
      label: "CRM Inbox",
      title: "Customer Inbox",
      description: "Read and respond to customer enquiries",
      icon: MessageSquare,
    },
    {
      id: "support",
      label: "Help & Support",
      title: "Support Desk",
      description: "Triage, assign and resolve customer tickets",
      icon: LifeBuoy,
    },
    {
      id: "analytics",
      label: "Analytics",
      title: "Business Analytics",
      description: "Marketplace performance and provider insights",
      icon: BarChart3,
    },
  ];
  const activeMenuItem =
    menuItems.find((item) => item.id === activeTab) || menuItems[0];

  // Handle send reply
  const handleSendReply = async (messageId) => {
    if (!replyText.trim()) return;
    try {
      const token = localStorage.getItem("servicehub_token");
      const response = await fetch(
        `${API_URL}/admin/contact-messages/${messageId}/reply`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reply: replyText.trim() }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Reply could not be sent.");

      const savedMessage = data.contactMessage;
      setAdminData?.((current) => ({
        ...current,
        contactMessages: (current?.contactMessages || []).map((message) =>
          message._id === messageId ? savedMessage : message,
        ),
      }));
      setSelectedMessage(savedMessage);
      setStatusMessage?.("Reply emailed to the customer and saved.");
      setReplyText("");
    } catch (err) {
      console.error(err);
      setStatusMessage?.(err.message || "Reply could not be sent.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-[#f4f7fb] font-sans text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* SIDEBAR */}
      <aside
        className={`z-30 flex h-full flex-shrink-0 flex-col bg-[#071126] text-white shadow-2xl shadow-slate-950/20 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-[76px]"}`}
      >
        <div className="flex h-[88px] flex-shrink-0 items-center justify-between border-b border-white/10 px-5">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/20">
                <LayoutDashboard size={19} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">
                  ServiceHub
                </h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-blue-300">
                  Admin workspace
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl p-2 text-slate-400 dark:text-slate-500 transition hover:bg-white/10 hover:text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {sidebarOpen && (
            <p className="px-3 pb-2 pt-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Workspace
            </p>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`admin-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-bold transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-400 dark:text-slate-500 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  className={`flex-shrink-0 ${activeTab === item.id ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-300"}`}
                />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="mt-auto border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white"
          >
            <LogOut size={17} />
            {sidebarOpen && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f7fb] dark:bg-slate-950">
        {/* TOP BAR */}
        <div className="z-10 flex min-h-[88px] flex-shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 px-5 py-4 shadow-sm shadow-slate-200/30 dark:shadow-black/20 sm:px-7 lg:px-9">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
              administration
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {activeMenuItem.title}
            </h1>
            <p className="mt-0.5 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              {activeMenuItem.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Systems
              operational
            </div>
            {setIsAdminMode && (
              <button
                type="button"
                onClick={() => setIsAdminMode(false)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:px-4"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Exit Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 space-y-7 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Total Users
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {totalUsersCount}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={24} />
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Active Providers
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {Math.max(
                        Number(stats.totalProviders) || 0,
                        providerCount,
                      )}
                    </h3>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Briefcase size={24} />
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Total Bookings
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {Math.max(Number(stats.totalBookings) || 0, bookingCount)}
                    </h3>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <CalendarDays size={24} />
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Pending Work Queue
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {pendingBookingsCount}
                    </h3>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                    <Clock size={24} />
                  </div>
                </div>

                <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Completed Deliveries
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {completedWorkCount}
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
                <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-100 dark:border-white/10">
                  <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
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
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {provider.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-100 dark:border-white/10">
                  <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                    Recent Service Requests
                  </h2>
                  <div className="divide-y divide-slate-100">
                    {(adminData?.bookings || []).slice(0, 5).map((booking) => (
                      <div
                        key={booking._id}
                        className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {booking.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
              <div className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 lg:p-6">
                <div className="flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-950 dark:text-white">
                        Active bookings
                      </h2>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                        {filteredBookings.length} of {bookingCount}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Search, assign and update incoming service requests.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative min-w-[260px] flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        value={bookingSearch}
                        onChange={(event) =>
                          setBookingSearch(event.target.value)
                        }
                        placeholder="Search booking, customer or phone"
                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 pl-10 pr-3 text-xs font-semibold outline-none transition focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50"
                      />
                    </label>
                    <select
                      aria-label="Filter bookings by service"
                      value={bookingServiceFilter}
                      onChange={(event) =>
                        setBookingServiceFilter(event.target.value)
                      }
                      className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-blue-400"
                    >
                      <option value="all">All services</option>
                      {bookingServices.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter bookings by status"
                      value={bookingStatusFilter}
                      onChange={(event) =>
                        setBookingStatusFilter(event.target.value)
                      }
                      className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-blue-400"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="accepted">Accepted</option>
                      <option value="job_started">In progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">
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
                    {filteredBookings.map((booking) => {
                      const cleanStatus =
                        booking.status?.toLowerCase() || "pending";
                      return (
                        <tr
                          key={booking._id}
                          className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4 pl-6 font-mono text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {booking._id ? booking._id.slice(-6) : "-"}
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {booking.name || "-"}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                            {booking.phone || "-"}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="inline-block bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 text-xs font-semibold px-2.5 py-1 rounded-lg">
                              {booking.service || "-"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-700 dark:text-slate-200 font-semibold whitespace-nowrap">
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
                              className="w-full rounded-lg border border-slate-300 dark:border-white/10 px-2 py-2 text-xs bg-white dark:bg-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200"
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
                          <td className="p-4 text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">
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
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">
                                  Completed
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan="10" className="px-6 py-16 text-center">
                          <Inbox
                            className="mx-auto mb-3 text-slate-300"
                            size={30}
                          />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            No bookings match these filters
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setBookingSearch("");
                              setBookingStatusFilter("all");
                              setBookingServiceFilter("all");
                            }}
                            className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                          >
                            Clear filters
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROVIDERS NETWORK TAB */}
          {activeTab === "providers" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
              <div className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 lg:p-6">
                <div className="flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-950 dark:text-white">
                        Provider directory
                      </h2>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700">
                        {filteredProviders.length} of {providerCount}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Review profiles, verification and network access.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative min-w-[250px] flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        value={providerSearch}
                        onChange={(event) =>
                          setProviderSearch(event.target.value)
                        }
                        placeholder="Search name, phone or location"
                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 pl-10 pr-3 text-xs font-semibold outline-none transition focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50"
                      />
                    </label>
                    <select
                      aria-label="Filter providers by category"
                      value={providerCategoryFilter}
                      onChange={(event) =>
                        setProviderCategoryFilter(event.target.value)
                      }
                      className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-blue-400"
                    >
                      <option value="all">All categories</option>
                      {providerCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter providers by verification"
                      value={providerStatusFilter}
                      onChange={(event) =>
                        setProviderStatusFilter(event.target.value)
                      }
                      className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-blue-400"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6 min-w-[90px] whitespace-nowrap">
                        Photo
                      </th>
                      <th className="p-4 min-w-[150px] whitespace-nowrap">
                        Provider Business Name
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
                      <th className="p-4 min-w-[160px] whitespace-nowrap">
                        KYC / Aadhaar
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
                    {filteredProviders.map((provider) => {
                      const cleanAppStatus =
                        provider.approvalStatus?.toLowerCase() || "pending";
                      return (
                        <tr
                          key={provider._id}
                          className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4 pl-6 whitespace-nowrap">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-slate-950/60 flex-shrink-0">
                              {provider.profileImage ? (
                                <img
                                  src={provider.profileImage}
                                  className="h-full w-full object-cover"
                                  alt={`${provider.name || "Provider"} profile`}
                                />
                              ) : (
                                <span className="text-xs font-black uppercase text-blue-700">
                                  {String(provider.name || "PR")
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join("")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {provider.businessName || provider.name}
                            </p>
                            <p className="mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                              Owner: {provider.ownerName || provider.name || "-"}
                            </p>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                            {provider.category ||
                              provider.customCategory ||
                              "-"}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">
                            {provider.phone}
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap capitalize">
                            {provider.preferredWorkLocation || "MIDC"}
                          </td>
                          <td className="p-4 font-bold text-amber-500 whitespace-nowrap">
                            ⭐ {provider.rating || 0}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                                  provider.aadhaarFrontAvailable || provider.aadhaarFrontUrl
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {provider.aadhaarFrontAvailable || provider.aadhaarFrontUrl ? (
                                  <CheckCircle size={12} />
                                ) : (
                                  <AlertCircle size={12} />
                                )}
                                {provider.aadhaarFrontAvailable || provider.aadhaarFrontUrl ? "Uploaded" : "Missing"}
                              </span>
                              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {provider.aadhaarNumberMasked || "Not submitted"}
                              </p>
                            </div>
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
                                className="bg-slate-100 dark:bg-white/10 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition flex-shrink-0"
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
                                  className="whitespace-nowrap bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-rose-50 hover:text-rose-600 transition border border-slate-200 dark:border-white/10 flex-shrink-0"
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
                    {filteredProviders.length === 0 && (
                      <tr>
                        <td colSpan="8" className="px-6 py-16 text-center">
                          <Users
                            className="mx-auto mb-3 text-slate-300"
                            size={30}
                          />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            No providers match these filters
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setProviderSearch("");
                              setProviderStatusFilter("all");
                              setProviderCategoryFilter("all");
                            }}
                            className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                          >
                            Clear filters
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CLIENT NETWORK TAB */}
          {activeTab === "clients" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
              <div className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 lg:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-950 dark:text-white">
                        Client directory
                      </h2>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                        {filteredClients.length} of {adminData?.users?.length || 0}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Registered clients with booking, cancellation and spend summary.
                    </p>
                  </div>
                  <label className="relative min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      value={clientSearch}
                      onChange={(event) => setClientSearch(event.target.value)}
                      placeholder="Search client name, phone or email"
                      className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 pl-10 pr-3 text-xs font-semibold outline-none transition focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50"
                    />
                  </label>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Client</th>
                      <th className="px-5 py-3.5">Phone</th>
                      <th className="px-5 py-3.5">Address</th>
                      <th className="px-5 py-3.5 text-center">Bookings</th>
                      <th className="px-5 py-3.5 text-center">Active</th>
                      <th className="px-5 py-3.5 text-center">Completed</th>
                      <th className="px-5 py-3.5 text-center">Cancelled</th>
                      <th className="px-5 py-3.5 text-right">Total spend</th>
                      <th className="px-5 py-3.5">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map((client) => {
                      const clientStats = getClientBookingStats(client);
                      return (
                        <tr key={client._id} className="transition hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-900 dark:text-white">
                              {client.name || "Client"}
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {client.email || "No email"}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                            {client.phone || "-"}
                          </td>
                          <td className="max-w-[260px] px-5 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {client.address || "Not added"}
                          </td>
                          <td className="px-5 py-4 text-center font-black text-slate-900 dark:text-white">
                            {clientStats.total}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-blue-600">
                            {clientStats.active}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-emerald-600">
                            {clientStats.completed}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-rose-600">
                            {clientStats.cancelled}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-slate-900 dark:text-white">
                            {formatCurrency(clientStats.spend)}
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {formatDateTime(client.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredClients.length === 0 && (
                      <tr>
                        <td colSpan="9" className="px-6 py-16 text-center">
                          <User className="mx-auto mb-3 text-slate-300" size={30} />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            No clients match these filters
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAYMENTS TAB - UPDATED WITH PROVIDER PAYOUT SUMMARY */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">
                    Settlement overview
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Reconcile completed jobs and release provider earnings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={refreshAdminPayments}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <RefreshCw size={14} /> Sync payment data
                </button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-white/10 shadow-xs">
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                    Gross Capital Pipeline
                  </p>
                  <h3 className="text-2xl font-black mt-2 text-slate-950 dark:text-white">
                    {formatCurrency(totalRevenue)}
                  </h3>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-white/10 shadow-xs">
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                    Provider Share (80%)
                  </p>
                  <h3 className="text-2xl font-black mt-2 text-emerald-600">
                    {formatCurrency(totalRevenue * 0.8)}
                  </h3>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-white/10 shadow-xs">
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                    Platform overhead (20%)
                  </p>
                  <h3 className="text-2xl font-black mt-2 text-blue-600">
                    {formatCurrency(totalRevenue * 0.2)}
                  </h3>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-white/10 shadow-xs">
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                    Escrow Clearing
                  </p>
                  <h3 className="text-2xl font-black mt-2 text-amber-500">
                    {formatCurrency(pendingPayoutValue)}
                  </h3>
                </div>
              </div>

              {/* Provider Payout Summary */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-100 dark:border-white/10 overflow-hidden">
                <div className="p-5 border-b bg-slate-50/50 dark:bg-slate-950/60">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Provider Payout Summary
                  </h3>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
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
                      <p className="text-xs text-slate-500 dark:text-slate-400">Pending Payments</p>
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
                      <p className="text-xs text-slate-500 dark:text-slate-400">Completed Jobs</p>
                      <h3 className="text-xl font-bold text-blue-600">
                        {
                          adminData?.bookings?.filter(
                            (b) => b.status?.toLowerCase() === "completed",
                          ).length
                        }
                      </h3>
                    </div>

                    <div className="rounded-xl border p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Platform Earnings
                      </p>
                      <h3 className="text-xl font-bold text-purple-600">
                        {formatCurrency(totalRevenue * 0.2)}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/40 dark:shadow-black/20">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 dark:border-white/10 p-5 lg:flex-row lg:items-center">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white">
                      Provider payout ledger
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Completed bookings eligible for settlement.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative min-w-[250px]">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        value={paymentSearch}
                        onChange={(event) =>
                          setPaymentSearch(event.target.value)
                        }
                        placeholder="Search customer or service"
                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 pl-10 pr-3 text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900"
                      />
                    </label>
                    <select
                      aria-label="Filter payouts by status"
                      value={paymentStatusFilter}
                      onChange={(event) =>
                        setPaymentStatusFilter(event.target.value)
                      }
                      className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-blue-400"
                    >
                      <option value="all">All payouts</option>
                      <option value="pending">Pending release</option>
                      <option value="released">Released</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                      <tr>
                        <th className="px-5 py-3.5">Customer / booking</th>
                        <th className="px-5 py-3.5">Provider</th>
                        <th className="px-5 py-3.5">Service</th>
                        <th className="px-5 py-3.5 text-right">Gross</th>
                        <th className="px-5 py-3.5 text-right">
                          Provider share
                        </th>
                        <th className="px-5 py-3.5 text-center">Status</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payoutBookings.map((booking) => {
                        const grossAmount =
                          Number(
                            booking.finalEstimateAmount || booking.amount,
                          ) || 0;
                        return (
                          <tr
                            key={booking._id}
                            className="transition hover:bg-slate-50 dark:hover:bg-white/5"
                          >
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {booking.name || "Unknown customer"}
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                #
                                {String(
                                  booking.bookingId || booking._id || "",
                                ).slice(-8)}
                              </p>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                              {booking.assignedProviderName ||
                                booking.requestedProviderName ||
                                "Unassigned"}
                            </td>
                            <td className="px-5 py-4">
                              <span className="rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                                {booking.service || "Service"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-bold text-slate-700 dark:text-slate-200">
                              {formatCurrency(grossAmount)}
                            </td>
                            <td className="px-5 py-4 text-right font-black text-slate-950 dark:text-white">
                              {formatCurrency(grossAmount * 0.8)}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-black ${booking.providerPaymentReleased ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                              >
                                {booking.providerPaymentReleased
                                  ? "Released"
                                  : "Pending"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              {booking.providerPaymentReleased ? (
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                  Complete
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReleasePayment(booking._id)
                                  }
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                                >
                                  Release payout
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {payoutBookings.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-6 py-14 text-center text-sm font-semibold text-slate-400 dark:text-slate-500"
                          >
                            No completed payouts match these filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MESSAGES CRM INBOX */}
          {activeTab === "messages" && (
            <div className="flex h-[680px] overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
              <div className="flex w-[360px] flex-shrink-0 flex-col border-r border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-slate-950/60 xl:w-[400px]">
                <div className="flex-shrink-0 space-y-3 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-950 dark:text-white">
                        Customer enquiries
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {filteredMessages.length} conversations
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Refresh customer messages"
                      onClick={refreshAdminContactMessages}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-white/10 text-blue-600 transition hover:bg-blue-50"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                  <label className="relative block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      value={messageSearch}
                      onChange={(event) => setMessageSearch(event.target.value)}
                      placeholder="Search name, email or message"
                      className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 pl-10 pr-3 text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </label>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredMessages.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                      No customer enquiries match your search.
                    </div>
                  ) : (
                    filteredMessages.map((msg) => (
                      <button
                        type="button"
                        key={msg._id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`w-full p-5 text-left transition-all ${selectedMessage?._id === msg._id ? "border-l-4 border-blue-600 bg-blue-50/70" : "border-l-4 border-transparent bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="truncate text-sm font-black text-slate-900 dark:text-white">
                            {msg.name || "Unknown customer"}
                          </h4>
                          {msg.repliedAt && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                              REPLIED
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {msg.subject ? `${msg.subject}: ` : ""}
                          {msg.message}
                        </p>
                        <p className="mt-2 truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          {msg.email || msg.phone || "No contact details"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/60">
                {selectedMessage ? (
                  <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                    <div className="p-4 border-b bg-slate-50/40 dark:bg-slate-950/60 flex-shrink-0">
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {selectedMessage.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedMessage.email}
                      </p>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-100 dark:border-white/10 max-w-xl">
                        <p className="text-slate-800 dark:text-slate-100 text-sm whitespace-pre-line leading-relaxed">
                          {selectedMessage.message}
                        </p>
                      </div>
                      {selectedMessage.adminReply && (
                        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 max-w-xl ml-auto">
                          <p className="text-slate-900 dark:text-white text-sm font-medium whitespace-pre-line">
                            {selectedMessage.adminReply}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t flex gap-3 items-end flex-shrink-0 bg-white dark:bg-slate-900">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type official response here..."
                        className="flex-1 border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950/60 h-20 resize-none"
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
                  <div className="flex flex-1 flex-col items-center justify-center px-8 text-center text-slate-400 dark:text-slate-500">
                    <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 dark:bg-white/10">
                      <MessageSquare
                        size={26}
                        className="stroke-1 text-slate-400 dark:text-slate-500"
                      />
                    </div>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                      Select a conversation
                    </p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400 dark:text-slate-500">
                      Choose a customer enquiry from the inbox to read and
                      respond.
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-white/10 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Avg Basket Scale
                    </p>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">
                      ₹{avgTicketSize}
                    </h4>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-white/10 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <Award size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Job Fulfillment
                    </p>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">
                      {fulfillmentRate}%
                    </h4>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-white/10 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Operator Conversion
                    </p>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">
                      {providerConversion}%
                    </h4>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5">
                    Top Volume Service Sectors
                  </h3>
                  <div className="space-y-4.5">
                    {realTopServices.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
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
                              <span className="text-slate-700 dark:text-slate-200">{svc.name}</span>
                              <span className="text-slate-900 dark:text-white">
                                {svc.value} Capture Requests ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
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
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5">
                    Network Operator Leaderboards
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {leaderBoardProviders.map((p, index) => (
                      <div
                        key={p._id || index}
                        className="py-3 flex justify-between items-center last:pb-0 first:pt-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                            #0{index + 1}
                          </span>
                          <p className="font-bold text-xs text-slate-900 dark:text-white whitespace-nowrap">
                            {p.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-amber-500 whitespace-nowrap">
                            ⭐ {p.rating || "5.0"}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
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
                    value: Math.max(
                      Number(supportAnalytics?.total) || 0,
                      visibleSupportSummary.total,
                    ),
                    icon: LifeBuoy,
                    color: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10",
                  },
                  {
                    label: "Open Tickets",
                    value: Math.max(
                      Number(supportAnalytics?.open) || 0,
                      visibleSupportSummary.open,
                    ),
                    icon: AlertCircle,
                    color: "text-blue-600 bg-blue-50",
                  },
                  {
                    label: "Resolved",
                    value: Math.max(
                      Number(supportAnalytics?.resolved) || 0,
                      visibleSupportSummary.resolved,
                    ),
                    icon: CheckCircle,
                    color: "text-emerald-600 bg-emerald-50",
                  },
                  {
                    label: "Avg Resolution",
                    value: supportAnalytics?.avgResolutionTime ?? "N/A",
                    icon: Clock,
                    color: "text-purple-600 bg-purple-50",
                  },
                  {
                    label: "High/Urgent",
                    value: Math.max(
                      Number(supportAnalytics?.highPriority) || 0,
                      visibleSupportSummary.highPriority,
                    ),
                    icon: AlertCircle,
                    color: "text-rose-600 bg-rose-50",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <h3 className="mt-1.5 text-xl font-black text-slate-900 dark:text-white">
                        {stat.value}
                      </h3>
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Ticket Interface */}
              <div className="flex h-[700px] overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
                {/* Left Ticket Queue Sidebar */}
                <div className="flex w-[390px] flex-shrink-0 flex-col border-r border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-slate-950/60 xl:w-[430px]">
                  {/* Search & Filters */}
                  <div className="flex-shrink-0 space-y-3 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-950 dark:text-white">
                          Helpdesk queue
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {supportTickets.length} tickets in this view
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          fetchSupportTickets();
                          fetchSupportAnalytics();
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-2 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
                      >
                        <RefreshCw size={12} /> Sync
                      </button>
                    </div>

                    <div className="relative font-sans">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        placeholder="Search ticket, subject, user or email"
                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 pl-9 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <select
                        value={ticketStatusFilter}
                        onChange={(e) => setTicketStatusFilter(e.target.value)}
                        className="h-9 min-w-0 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 px-2 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
                      >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Waiting for Customer">Waiting</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>

                      <select
                        value={ticketCategoryFilter}
                        onChange={(e) =>
                          setTicketCategoryFilter(e.target.value)
                        }
                        className="h-9 min-w-0 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 px-2 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
                      >
                        <option value="All">All types</option>
                        <option value="Booking Issue">Booking</option>
                        <option value="Payment Issue">Payment</option>
                        <option value="Provider Issue">Provider</option>
                        <option value="Account Issue">Account</option>
                        <option value="Technical Issue">Technical</option>
                        <option value="General Inquiry">General</option>
                      </select>

                      <select
                        value={ticketPriorityFilter}
                        onChange={(e) =>
                          setTicketPriorityFilter(e.target.value)
                        }
                        className="h-9 min-w-0 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 px-2 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
                      >
                        <option value="All">All Priority</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Queue Scrollable View */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {supportLoading ? (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        Fetching Queue...
                      </div>
                    ) : supportTickets.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                        No support tickets match these filters.
                      </div>
                    ) : (
                      supportTickets.map((t) => (
                        <button
                          type="button"
                          key={t.ticketId}
                          onClick={() => loadTicketDetails(t.ticketId)}
                          className={`w-full border-l-4 p-5 text-left transition hover:bg-slate-50 dark:hover:bg-white/5 ${
                            selectedTicket?.ticketId === t.ticketId
                              ? "border-blue-500 bg-blue-50/60 hover:bg-blue-50/60"
                              : "border-transparent bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              {t.ticketId}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                                t.priority === "Urgent"
                                  ? "bg-rose-50 text-rose-500 border-rose-100"
                                  : t.priority === "High"
                                    ? "bg-orange-50 text-orange-500 border-orange-100"
                                    : "bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/10"
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>
                          <h4 className="mb-1 line-clamp-2 text-sm font-black leading-5 text-slate-900 dark:text-white">
                            {t.subject}
                          </h4>
                          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span>By: {t.userName}</span>
                            <span
                              className={`rounded px-2 py-1 text-[9px] font-black uppercase ${
                                t.status === "Resolved"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : t.status === "Closed"
                                    ? "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                                    : t.status === "Waiting for Customer"
                                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                                      : "bg-blue-50 text-blue-600 border border-blue-100"
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Details & Conversation Panel */}
                <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-slate-900">
                  {selectedTicket ? (
                    <div className="flex flex-col h-full">
                      {/* Ticket Details Header */}
                      <div className="p-5 border-b bg-slate-50/40 dark:bg-slate-950/60 flex-shrink-0 flex items-start justify-between gap-4">
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase">
                              {selectedTicket.ticketId}
                            </span>
                            {selectedTicket.bookingId && (
                              <span className="text-[9px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded border">
                                Booking: {selectedTicket.bookingId}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1.5 text-base font-black leading-snug text-slate-950 dark:text-white">
                            {selectedTicket.subject}
                          </h3>
                          <p className="mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {selectedTicket.category} •{" "}
                            {selectedTicket.priority} priority •{" "}
                            {selectedTicket.userName} (
                            {selectedTicket.userEmail})
                          </p>
                        </div>

                        {/* Dropdown controls (Assign & Status) */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-slate-400 dark:text-slate-500 w-16 text-right">
                              Assignee:
                            </span>
                            <select
                              value={selectedTicket.assignedTo || ""}
                              onChange={(e) =>
                                handleTicketAssign(
                                  selectedTicket.ticketId,
                                  e.target.value,
                                )
                              }
                              className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-1.5 text-slate-700 dark:text-slate-200 text-[11px] font-bold outline-none focus:border-blue-500 w-44"
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
                            <span className="text-slate-400 dark:text-slate-500 w-16 text-right">
                              Status:
                            </span>
                            <select
                              value={selectedTicket.status}
                              onChange={(e) =>
                                handleTicketStatusChange(
                                  selectedTicket.ticketId,
                                  e.target.value,
                                )
                              }
                              className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-1.5 text-slate-700 dark:text-slate-200 text-[11px] font-bold outline-none focus:border-blue-500 w-44"
                            >
                              <option value="Open">Open</option>
                              <option value="Assigned">Assigned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Waiting for Customer">
                                Waiting for Customer
                              </option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Message Thread view */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20 dark:bg-slate-950/60">
                        {/* Original ticket details card */}
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-slate-600 dark:text-slate-300">
                              <User size={12} />
                            </div>
                            <div>
                              <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
                                {selectedTicket.userName}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold ml-2">
                                CREATED TICKETS
                              </span>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                            {selectedTicket.description}
                          </p>

                          {/* Original attachments */}
                          {selectedTicket.attachments &&
                            selectedTicket.attachments.length > 0 && (
                              <div className="mt-3.5 grid grid-cols-2 gap-2">
                                {selectedTicket.attachments.map((file, idx) => (
                                  <a
                                    key={idx}
                                    href={file.url}
                                    download={file.name}
                                    className="flex items-center gap-2 p-2 border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition text-left"
                                  >
                                    <FileText className="h-4 w-4 text-pink-500 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-[8px] text-blue-500 font-black tracking-wider uppercase">
                                        Download File
                                      </p>
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
                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-xl border text-left ${
                                isInternal
                                  ? "bg-amber-50/80 border-amber-200 text-amber-900 shadow-sm"
                                  : isUser
                                    ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10"
                                    : "bg-blue-50/30 border-blue-100"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`grid h-6 w-6 place-items-center rounded-full border ${
                                      isUser
                                        ? "bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                                        : isInternal
                                          ? "bg-amber-200/50 border-amber-300 text-amber-700"
                                          : "bg-blue-100 border-blue-200 text-blue-700"
                                    }`}
                                  >
                                    {isUser ? (
                                      <User size={12} />
                                    ) : (
                                      <LifeBuoy size={12} />
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
                                      {msg.senderId?.name || "Support desk"}
                                    </span>
                                    <span
                                      className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-2 ${
                                        isInternal
                                          ? "bg-amber-200 text-amber-800"
                                          : isUser
                                            ? "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                                            : "bg-blue-100 text-blue-800"
                                      }`}
                                    >
                                      {isInternal
                                        ? "Internal Note"
                                        : isUser
                                          ? "Client"
                                          : "Support Desk"}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                                  {new Date(msg.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                                {msg.message}
                              </p>

                              {/* Message attachment */}
                              {msg.attachment && msg.attachment.url && (
                                <div className="mt-3.5">
                                  <a
                                    href={msg.attachment.url}
                                    download={msg.attachment.name}
                                    className="inline-flex items-center gap-2 p-2 border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition text-left max-w-sm"
                                  >
                                    <FileText className="h-4 w-4 text-pink-500 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                        {msg.attachment.name}
                                      </p>
                                      <p className="text-[8px] text-blue-500 font-black tracking-wider uppercase">
                                        Download File
                                      </p>
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
                      <form
                        onSubmit={handleSendTicketReply}
                        className="p-4 border-t bg-slate-50/50 dark:bg-slate-950/60 flex-shrink-0 text-left"
                      >
                        {ticketReplyAttachment && (
                          <div className="mb-2 flex items-center justify-between text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-xl border">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Paperclip size={14} className="text-pink-500" />
                              {ticketReplyAttachment.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setTicketReplyAttachment(null)}
                              className="text-slate-400 dark:text-slate-500 hover:text-slate-700"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <label className="grid h-9 w-9 place-items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 cursor-pointer transition flex-shrink-0">
                            <Paperclip size={16} />
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleAdminFileChange}
                            />
                          </label>

                          <input
                            type="text"
                            value={ticketReplyText}
                            onChange={(e) => setTicketReplyText(e.target.value)}
                            placeholder={
                              isInternalNote
                                ? "Write an internal team note..."
                                : "Respond to the client..."
                            }
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition"
                          />

                          <button
                            type="submit"
                            disabled={
                              replyLoading ||
                              (!ticketReplyText.trim() &&
                                !ticketReplyAttachment)
                            }
                            className={`flex items-center gap-1.5 px-4 rounded-xl text-xs font-black text-white disabled:opacity-45 transition flex-shrink-0 ${
                              isInternalNote
                                ? "bg-amber-500 hover:bg-amber-600"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            {replyLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <>
                                <Send size={12} />{" "}
                                {isInternalNote ? "Add Note" : "Send Reply"}
                              </>
                            )}
                          </button>
                        </div>

                        {/* Internal Note Checkbox */}
                        <div className="mt-3.5 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
                          <input
                            type="checkbox"
                            id="internalNoteCheckbox"
                            checked={isInternalNote}
                            onChange={(e) =>
                              setIsInternalNote(e.target.checked)
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 dark:border-white/10 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="internalNoteCheckbox"
                            className="cursor-pointer"
                          >
                            Mark as Internal Note (Only visible to support
                            agents)
                          </label>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-400">
                        <LifeBuoy className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                        Select a support ticket
                      </p>
                      <p className="mt-1 max-w-sm text-xs font-medium leading-5 text-slate-400 dark:text-slate-500">
                        Open a ticket from the queue to review the full
                        conversation, assign an agent and update its status.
                      </p>
                    </div>
                  )}
                </div>
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

      {/* PROVIDER DETAIL DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto flex flex-col transform transition-transform duration-300 ease-in-out ${activeDrawerProvider ? "translate-x-0" : "translate-x-full"}`}
      >
        {activeDrawerProvider && (
          <>
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Provider profile details
              </h3>
              <button
                onClick={() => setActiveDrawerProvider(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 border-b pb-6 mb-6">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-blue-500 bg-blue-50 p-0.5 shadow-md">
                {activeDrawerProvider.profileImage ? (
                  <img
                    src={activeDrawerProvider.profileImage}
                    className="h-full w-full rounded-full object-cover"
                    alt={`${activeDrawerProvider.name || "Provider"} profile`}
                  />
                ) : (
                  <span className="text-xl font-black uppercase text-blue-700">
                    {String(activeDrawerProvider.name || "PR")
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {activeDrawerProvider.businessName || activeDrawerProvider.name}
              </h4>
              <p className="text-xs text-blue-600 font-bold uppercase">
                {activeDrawerProvider.category || "Verified Node"}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Owner: {activeDrawerProvider.ownerName || activeDrawerProvider.name || "Not added"}
              </p>
            </div>
            <div className="space-y-4 flex-1 text-sm">
              <div className="grid gap-3 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-4">
                {[
                  ["Business name", activeDrawerProvider.businessName || activeDrawerProvider.name],
                  ["Owner full name", activeDrawerProvider.ownerName || activeDrawerProvider.name],
                  ["Phone", activeDrawerProvider.phone || "No records"],
                  ["Email", activeDrawerProvider.email || "No email attached"],
                  ["Location hub", activeDrawerProvider.preferredWorkLocation || activeDrawerProvider.location || "Not added"],
                  ["Full address", activeDrawerProvider.address || activeDrawerProvider.location || "Not added"],
                  ["Aadhaar", activeDrawerProvider.aadhaarNumberMasked || "Not uploaded"],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {label}
                    </span>
                    <span className="break-words font-bold text-slate-800 dark:text-slate-100">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-100 dark:border-white/10 flex justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">
                    Trust Rating
                  </p>
                  <p className="text-base font-black text-slate-800 dark:text-slate-100">
                    ⭐ {activeDrawerProvider.rating || "5.0"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">
                    Network Status
                  </p>
                  <span className="text-[10px] font-black text-green-700 uppercase bg-green-100 px-2 py-0.5 rounded">
                    {activeDrawerProvider.approvalStatus || "pending"}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Aadhaar verification
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {activeDrawerProvider.aadhaarNumberMasked || "Aadhaar number not submitted"}
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase text-indigo-700">
                    {activeDrawerProvider.verificationStatus || "pending"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {[
                    {
                      label: "Front / PDF",
                      metadata: activeDrawerProvider.documents?.aadhaarFront,
                      available: activeDrawerProvider.documents?.aadhaarFront?.available || activeDrawerProvider.aadhaarFrontAvailable,
                      side: "front",
                      name: activeDrawerProvider.aadhaarDocumentName,
                      required: true,
                    },
                    {
                      label: "Back image",
                      metadata: activeDrawerProvider.documents?.aadhaarBack,
                      available: activeDrawerProvider.documents?.aadhaarBack?.available || activeDrawerProvider.aadhaarBackAvailable,
                      side: "back",
                      name: activeDrawerProvider.aadhaarBackDocumentName,
                      required: false,
                    },
                  ].map((document) => (
                    <div
                      key={document.label}
                      className={`rounded-xl border p-3 ${
                        document.available
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {document.label}
                          </p>
                          <p className="mt-1 truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                            {documentLabel(document.metadata?.fileName || document.name, document.available ? "uploaded" : "")}
                          </p>
                          {document.available && (
                            <p className="mt-1 text-[10px] font-semibold text-slate-500">
                              Uploaded: {formatDateTime(document.metadata?.uploadedAt)}
                              {document.metadata?.mimeType ? ` · ${document.metadata.mimeType}` : ""}
                            </p>
                          )}
                        </div>
                        {document.available ? (
                          <div className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => openDocumentInNewTab({ providerId: activeDrawerProvider._id, side: document.side, onError: setStatusMessage })} className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-[11px] font-black uppercase text-white hover:bg-slate-800">
                              <Eye size={13} /> View
                            </button>
                            <button type="button" onClick={() => downloadDocument({ providerId: activeDrawerProvider._id, side: document.side, fileName: document.metadata?.fileName || document.name, onError: setStatusMessage })} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-black uppercase text-white hover:bg-indigo-700">
                              <Download size={13} /> Download
                            </button>
                          </div>
                        ) : (
                          <span className="shrink-0 rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">
                            {document.required ? "Required" : "Optional"}
                          </span>
                        )}
                      </div>
                      {!document.available && document.required && (
                        <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <AlertCircle size={12} />
                          Cannot approve without Aadhaar front or PDF.
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {activeDrawerProvider.verificationRejectedReason && (
                  <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700">
                    {activeDrawerProvider.verificationRejectedReason}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Timeline
                </p>
                <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Requested: {formatDateTime(activeDrawerProvider.requestedAt || activeDrawerProvider.createdAt)}</span>
                  <span>Approved: {formatDateTime(activeDrawerProvider.approvedAt)}</span>
                  <span>Rejected: {formatDateTime(activeDrawerProvider.rejectedAt)}</span>
                  <span>Suspended: {formatDateTime(activeDrawerProvider.suspendedAt)}</span>
                  <span>Last updated: {formatDateTime(activeDrawerProvider.updatedAt)}</span>
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
                Approve
              </button>
              <button
                onClick={() => {
                  const rejectionReason = window.prompt(
                    "Reason for rejection or suspension",
                    activeDrawerProvider.verificationRejectedReason || "",
                  );
                  updateProviderApproval(activeDrawerProvider._id, "rejected", rejectionReason || "");
                  setActiveDrawerProvider(null);
                }}
                className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-red-700 transition"
              >
                Reject / Suspend
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
