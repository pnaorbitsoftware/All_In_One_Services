import { AnimatePresence, motion } from "framer-motion";
import {
  LifeBuoy,
  X,
  ChevronRight,
  Search,
  ArrowLeft,
  Send,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Paperclip,
  ShieldAlert,
  CreditCard,
  BookOpen,
  History,
  User,
  Clock,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const statusColors = {
  Open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Assigned: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "In Progress": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Waiting for Customer": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const timelineSteps = [
  { status: "Open", label: "Ticket Filed" },
  { status: "Assigned", label: "Agent Assigned" },
  { status: "In Progress", label: "Under Review" },
  { status: "Waiting for Customer", label: "Response Needed" },
  { status: "Resolved", label: "Resolved" },
];

export default function HelpSupportCenter({ user, onLogin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState("menu"); // "menu", "create", "list", "detail", "faq"
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Fields
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Booking Issue");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [attachments, setAttachments] = useState([]);

  // Reply Fields
  const [replyMessage, setReplyMessage] = useState("");
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Filter & Search
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState("All");

  const messageEndRef = useRef(null);

  const token = localStorage.getItem("servicehub_token");

  useEffect(() => {
    if (activeScreen === "detail" && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeScreen]);

  const fetchTickets = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error("Error fetching support tickets:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && token && user?.role === "user") {
      const timerId = window.setTimeout(() => fetchTickets(), 0);
      return () => window.clearTimeout(timerId);
    }
    return undefined;
    // Fetch when the support panel or authenticated user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, token, user?.role]);

  const showToast = (msg, success = true) => {
    setStatusMessage(msg);
    setIsSuccess(success);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const fetchTicketDetails = async (ticketId, { silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSelectedTicket(data.ticket);
        setMessages(data.messages);
        setActiveScreen("detail");
      } else {
        showToast(data.message || "Could not retrieve ticket details.", false);
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to server.", false);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !token || user?.role !== "user") return undefined;

    const refreshSupport = () => {
      if (document.visibilityState !== "visible") return;
      if (activeScreen === "detail" && selectedTicket?.ticketId) {
        fetchTicketDetails(selectedTicket.ticketId, { silent: true });
      } else {
        fetchTickets({ silent: true });
      }
    };
    const timerId = window.setInterval(refreshSupport, 15000);
    document.addEventListener("visibilitychange", refreshSupport);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", refreshSupport);
    };
    // Keep only the visible support screen live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScreen, isOpen, selectedTicket?.ticketId, token, user?.role]);

  const handleFileChange = (e, isReply = false) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds the 5MB size limit.`, false);
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
        showToast(`Format of "${file.name}" not supported. Use Images, PDFs, Word, or Text.`, false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const fileObj = { name: file.name, url: reader.result };
        if (isReply) {
          setReplyAttachment(fileObj);
        } else {
          setAttachments((prev) => [...prev, fileObj]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast("Please log in to submit a ticket.", false);
      onLogin?.();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          description,
          category,
          priority,
          bookingId,
          attachments,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast("Support ticket created successfully!");
        setSubject("");
        setDescription("");
        setBookingId("");
        setAttachments([]);
        fetchTickets();
        setActiveScreen("list");
      } else {
        showToast(data.message || "Failed to submit ticket.", false);
      }
    } catch (err) {
      console.error(err);
      showToast("Server connection error.", false);
    } finally {
      setIsLoading(false);
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() && !replyAttachment) return;

    setReplySubmitting(true);
    try {
      const response = await fetch(`${API_URL}/support/tickets/${selectedTicket.ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: replyMessage,
          attachment: replyAttachment,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessages((prev) => [...prev, data.data]);
        setReplyMessage("");
        setReplyAttachment(null);
        // Refresh ticket status locally (might have auto-reopened)
        if (selectedTicket.status === "Resolved" || selectedTicket.status === "Closed") {
          setSelectedTicket((prev) => ({ ...prev, status: "Open" }));
        }
      } else {
        showToast(data.message || "Could not post reply.", false);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to send reply.", false);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleQuickTicket = (cat, defaultSub = "") => {
    if (!user) {
      onLogin?.();
      return;
    }
    setCategory(cat);
    setSubject(defaultSub);
    setActiveScreen("create");
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketId.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(ticketSearch.toLowerCase());
    const matchesFilter = ticketFilter === "All" || t.status === ticketFilter;
    return matchesSearch && matchesFilter;
  });

  const getTimelineProgress = (status) => {
    const index = timelineSteps.findIndex((s) => s.status === status);
    if (status === "Closed") return 100;
    if (index === -1) return 0;
    return (index / (timelineSteps.length - 1)) * 100;
  };

  const faqs = [
    {
      q: "How do I cancel a service booking?",
      a: "Go to your dashboard, select the booking, and click Cancel. Bookings cancelled 24 hours prior to schedule receive a full refund.",
    },
    {
      q: "Where is my provider located?",
      a: "Once a provider accepts your booking, they will appear on the Live Map tracker which is viewable directly in your booking invoice details.",
    },
    {
      q: "How do I request a refund?",
      a: "Open a ticket here under the category 'Payment Issue' providing your Booking ID and description. Our settlement operations review refunds daily.",
    },
    {
      q: "What options do I have if a provider is unprofessional?",
      a: "We hold our providers to strict professional standards. Please select 'Report Provider' from the quick options, list their details, and submit a ticket.",
    },
  ];

  return (
    <>
      {/* FLOATING SUPPORT BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="servicehub-support-trigger fixed bottom-5 right-5 z-[80] flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 px-5 text-white shadow-[0_10px_30px_rgba(168,85,247,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_35px_rgba(168,85,247,0.5)] border border-white/10"
      >
        <LifeBuoy className="h-5 w-5 animate-pulse" />
        <span className="text-sm font-extrabold tracking-wide hidden sm:inline">Help & Support</span>
      </button>

      {/* SUPPORT CENTER SIDE PANEL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

            {/* Side Panel Content */}
            <motion.div
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative flex h-full w-full max-w-[480px] flex-col border-l border-slate-800 bg-slate-950 text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              {/* Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-violet-900/90 via-fuchsia-950/80 to-slate-950 p-6 border-b border-slate-800 flex-shrink-0">
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-pink-500/10 blur-3xl" />
                <div className="absolute bottom-0 left-12 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600/30 border border-violet-500/30 text-violet-400">
                      <LifeBuoy className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-wide text-white">Help & Support Center</h2>
                      <p className="text-xs text-slate-400">We are here to assist you 24/7</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Status Toast */}
              {statusMessage && (
                <div
                  className={`mx-4 mt-3 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-semibold ${
                    isSuccess
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {isSuccess ? <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />}
                  <span className="flex-1">{statusMessage}</span>
                </div>
              )}

              {/* Screen Container */}
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {/* 1. MAIN MENU SCREEN */}
                {activeScreen === "menu" && (
                  <div className="space-y-6">
                    {/* Primary options */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        onClick={() => {
                          if (!user) {
                            showToast("Please log in to raise support tickets.", false);
                            onLogin?.();
                          } else {
                            setActiveScreen("create");
                          }
                        }}
                        className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-violet-500/40 hover:bg-slate-900/90 transition text-left"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600/10 text-violet-400 group-hover:bg-violet-600/20 transition">
                          <LifeBuoy className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-white group-hover:text-violet-400 transition">Create Ticket</h3>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">Submit a new request to operations</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          if (!user) {
                            showToast("Please log in to view your tickets.", false);
                            onLogin?.();
                          } else {
                            setActiveScreen("list");
                          }
                        }}
                        className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-fuchsia-500/40 hover:bg-slate-900/90 transition text-left"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-fuchsia-600/10 text-fuchsia-400 group-hover:bg-fuchsia-600/20 transition">
                          <History className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-white group-hover:text-fuchsia-400 transition">My Tickets</h3>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">Track your active issues</p>
                        </div>
                      </button>
                    </div>

                    {/* Quick Category Tickets */}
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3">Quick Topic Actions</h4>
                      <div className="space-y-2">
                        {[
                          { label: "Report Provider", icon: ShieldAlert, cat: "Provider Issue", sub: "Report Unprofessional Behavior" },
                          { label: "Report Payment Issue", icon: CreditCard, cat: "Payment Issue", sub: "Double Charge / Refund Delayed" },
                          { label: "Technical Issue", icon: AlertCircle, cat: "Technical Issue", sub: "Platform Bug / Location GPS error" },
                          { label: "Account Issue", icon: User, cat: "Account Issue", sub: "Profile Edit / Security Reset" },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={() => handleQuickTicket(item.cat, item.sub)}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-900 bg-slate-900/30 hover:border-slate-800 hover:bg-slate-900/60 transition group text-left"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="h-4.5 w-4.5 text-slate-400 group-hover:text-pink-400 transition" />
                              <span className="text-xs font-bold text-slate-200 group-hover:text-white transition">{item.label}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-0.5 transition" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FAQ & Contact Links */}
                    <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-3.5">
                      <button
                        onClick={() => setActiveScreen("faq")}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/20 hover:bg-slate-900/40 border border-slate-900 transition text-left group"
                      >
                        <BookOpen className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">Browse FAQ</span>
                      </button>
                      
                      <a
                        href="/contact"
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/20 hover:bg-slate-900/40 border border-slate-900 transition group"
                      >
                        <MessageCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">General Contact</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* 2. CREATE TICKET FORM */}
                {activeScreen === "create" && (
                  <div>
                    <button
                      onClick={() => setActiveScreen("menu")}
                      className="mb-4 flex items-center gap-1.5 text-xs font-black text-violet-400 hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to menu
                    </button>

                    <h3 className="text-base font-black text-white mb-4">Submit a Support Ticket</h3>
                    <form onSubmit={submitTicket} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Subject</label>
                        <input
                          type="text"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Brief summary of the issue"
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Category</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-3 text-xs text-white outline-none focus:border-violet-500 transition"
                          >
                            <option value="Booking Issue">Booking Issue</option>
                            <option value="Payment Issue">Payment Issue</option>
                            <option value="Provider Issue">Provider Issue</option>
                            <option value="Account Issue">Account Issue</option>
                            <option value="Technical Issue">Technical Issue</option>
                            <option value="General Inquiry">General Inquiry</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Priority</label>
                          <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-3 text-xs text-white outline-none focus:border-violet-500 transition"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Booking ID (Optional)</label>
                        <input
                          type="text"
                          value={bookingId}
                          onChange={(e) => setBookingId(e.target.value)}
                          placeholder="e.g. SB-1002"
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Describe your issue</label>
                        <textarea
                          required
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Please provide full details..."
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 transition resize-none leading-relaxed"
                        />
                      </div>

                      {/* File Upload component */}
                      <div>
                        <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Attachments</label>
                        <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 hover:border-violet-500/40 rounded-xl p-5 cursor-pointer transition">
                          <UploadCloud className="h-7 w-7 text-slate-500 mb-1.5" />
                          <span className="text-xs font-bold text-slate-300">Upload Files</span>
                          <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, PDF, Word, TXT (Max 5MB)</span>
                          <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, false)} />
                        </label>

                        {/* List Attachments */}
                        {attachments.length > 0 && (
                          <div className="mt-3.5 space-y-2 bg-slate-900/20 p-2 border border-slate-900 rounded-xl">
                            {attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900 border border-slate-850">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="h-4.5 w-4.5 text-pink-400 flex-shrink-0" />
                                  <span className="font-semibold text-slate-300 truncate">{file.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-500 hover:text-white"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-750 font-extrabold text-sm text-white shadow-lg shadow-violet-600/30 transition disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Submitting Request...
                          </>
                        ) : (
                          "Submit Ticket"
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. MY TICKETS LIST */}
                {activeScreen === "list" && (
                  <div>
                    <button
                      onClick={() => setActiveScreen("menu")}
                      className="mb-4 flex items-center gap-1.5 text-xs font-black text-violet-400 hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to menu
                    </button>

                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-black text-white">My Support Tickets</h3>
                      <button
                        onClick={fetchTickets}
                        className="text-[11px] font-black text-violet-400 hover:underline flex items-center gap-1"
                      >
                        Refresh list
                      </button>
                    </div>

                    {/* Search & Filter bar */}
                    <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          value={ticketSearch}
                          onChange={(e) => setTicketSearch(e.target.value)}
                          placeholder="Search tickets by ID, subject..."
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition placeholder:text-slate-500"
                        />
                      </div>
                      <select
                        value={ticketFilter}
                        onChange={(e) => setTicketFilter(e.target.value)}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Waiting for Customer">Waiting for Customer</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    {/* Ticket List */}
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs font-bold gap-2">
                        <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
                        Loading tickets...
                      </div>
                    ) : filteredTickets.length === 0 ? (
                      <div className="text-center border border-slate-850 bg-slate-900/10 rounded-2xl py-14 px-4 text-slate-500">
                        <History className="h-9 w-9 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400">No support tickets found</p>
                        <p className="text-xs text-slate-500 mt-1">If you have any active inquiries, file a new support ticket.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTickets.map((ticket) => (
                          <div
                            key={ticket.ticketId}
                            onClick={() => fetchTicketDetails(ticket.ticketId)}
                            className="group p-4 border border-slate-900 hover:border-slate-800 rounded-2xl bg-slate-900/30 hover:bg-slate-900/70 transition cursor-pointer text-left relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-2.5 mb-2.5">
                              <span className="text-[11px] font-black text-violet-400 uppercase tracking-wider">{ticket.ticketId}</span>
                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                  statusColors[ticket.status] || statusColors.Open
                                }`}
                              >
                                {ticket.status}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition line-clamp-1 mb-2">
                              {ticket.subject}
                            </h4>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-850/50 pt-2.5">
                              <span>Cat: {ticket.category}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TICKET DETAILS & CHAT THREAD */}
                {activeScreen === "detail" && selectedTicket && (
                  <div className="flex flex-col h-full space-y-4">
                    <button
                      onClick={() => setActiveScreen("list")}
                      className="flex items-center gap-1.5 text-xs font-black text-violet-400 hover:underline self-start flex-shrink-0"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to active queue
                    </button>

                    {/* Ticket Header & Progress Tracker */}
                    <div className="p-4 border border-slate-850 bg-slate-900/40 rounded-2xl flex-shrink-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[11px] font-black text-violet-400 tracking-wider uppercase">{selectedTicket.ticketId}</span>
                          <h3 className="text-sm font-extrabold text-white mt-1 leading-snug">{selectedTicket.subject}</h3>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border flex-shrink-0 ${statusColors[selectedTicket.status]}`}>
                          {selectedTicket.status}
                        </span>
                      </div>

                      {/* Status Progress Timeline */}
                      <div className="mt-4 pt-3 border-t border-slate-850">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-500 mb-2">
                          <span>Timeline Tracking</span>
                          <span>Progress: {Math.round(getTimelineProgress(selectedTicket.status))}%</span>
                        </div>
                        <div className="relative h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-600 via-pink-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${getTimelineProgress(selectedTicket.status)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2.5 text-[9px] text-slate-400 font-black tracking-wide">
                          <span>Filed</span>
                          <span>Review</span>
                          <span>Resolved</span>
                        </div>
                      </div>
                    </div>

                    {/* Messages Thread view */}
                    <div className="flex-1 min-h-[220px] overflow-y-auto space-y-3.5 border border-slate-900 p-3 bg-slate-900/10 rounded-2xl divide-y divide-slate-900/50">
                      {/* Ticket Original Description as the first message */}
                      <div className="pt-2 text-left">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="grid h-6 w-6 place-items-center rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/20">
                            <User className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-white">{selectedTicket.userName}</span>
                            <span className="text-[9px] text-slate-500 ml-2 font-bold">CLIENT (ORIGINAL TICKET DESCRIPTION)</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-8 white-space: pre-wrap;">
                          {selectedTicket.description}
                        </p>

                        {/* Attachments if any */}
                        {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                          <div className="mt-3.5 ml-8 grid grid-cols-2 gap-2">
                            {selectedTicket.attachments.map((file, idx) => (
                              <a
                                key={idx}
                                href={file.url}
                                download={file.name}
                                className="flex items-center gap-2 p-2 border border-slate-800 bg-slate-900 hover:bg-slate-900/80 rounded-xl transition text-left"
                              >
                                <FileText className="h-4 w-4 text-pink-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-slate-300 truncate">{file.name}</p>
                                  <p className="text-[8px] text-violet-400 uppercase font-black tracking-wider">Download File</p>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Other conversation thread messages */}
                      {messages.map((msg, index) => {
                        const isClient = msg.senderRole === "user";
                        return (
                          <div key={index} className="pt-3.5 text-left">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`grid h-6 w-6 place-items-center rounded-full border ${
                                    isClient
                                      ? "bg-violet-600/25 text-violet-400 border-violet-500/20"
                                      : "bg-emerald-600/25 text-emerald-400 border-emerald-500/20"
                                  }`}
                                >
                                  {isClient ? <User className="h-3 w-3" /> : <LifeBuoy className="h-3 w-3" />}
                                </div>
                                <div>
                                  <span className="text-xs font-black text-white">{msg.senderId?.name || "Support Staff"}</span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded ml-2 font-black uppercase tracking-wider ${
                                      isClient ? "bg-violet-500/10 text-violet-400" : "bg-emerald-500/10 text-emerald-400"
                                    }`}
                                  >
                                    {isClient ? "Client" : "Support Desk"}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-slate-500">
                                {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed pl-8 white-space: pre-wrap;">
                              {msg.message}
                            </p>

                            {/* Message attachment if any */}
                            {msg.attachment && msg.attachment.url && (
                              <div className="mt-2.5 ml-8">
                                <a
                                  href={msg.attachment.url}
                                  download={msg.attachment.name}
                                  className="inline-flex items-center gap-2 p-2 border border-slate-800 bg-slate-900 hover:bg-slate-900/80 rounded-xl transition text-left max-w-sm"
                                >
                                  <FileText className="h-4 w-4 text-pink-400 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-slate-300 truncate">{msg.attachment.name}</p>
                                    <p className="text-[8px] text-violet-400 uppercase font-black tracking-wider">Download File</p>
                                  </div>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messageEndRef} />
                    </div>

                    {/* Reply Form */}
                    {selectedTicket.status === "Closed" ? (
                      <div className="p-3 text-center border border-slate-850 bg-slate-900/25 rounded-2xl text-slate-500 text-xs font-semibold">
                        This support ticket has been closed. If you have any follow-up questions, please file a new ticket.
                      </div>
                    ) : (
                      <form onSubmit={submitReply} className="flex-shrink-0 bg-slate-900 border border-slate-850 p-2.5 rounded-2xl">
                        {replyAttachment && (
                          <div className="mb-2 flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-950 rounded-xl border border-slate-850">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                              <Paperclip className="h-3.5 w-3.5 text-pink-400" />
                              {replyAttachment.name}
                            </span>
                            <button type="button" onClick={() => setReplyAttachment(null)} className="text-slate-500 hover:text-white">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <label className="grid h-9 w-9 place-items-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition">
                            <Paperclip className="h-4.5 w-4.5" />
                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, true)} />
                          </label>

                          <input
                            type="text"
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Type a response..."
                            className="min-w-0 flex-1 bg-transparent px-2.5 text-xs font-semibold text-white placeholder-slate-500 outline-none"
                          />

                          <button
                            type="submit"
                            disabled={replySubmitting || (!replyMessage.trim() && !replyAttachment)}
                            className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 hover:bg-violet-750 text-white disabled:opacity-45 transition"
                          >
                            {replySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* 5. FAQ SCREEN */}
                {activeScreen === "faq" && (
                  <div>
                    <button
                      onClick={() => setActiveScreen("menu")}
                      className="mb-4 flex items-center gap-1.5 text-xs font-black text-violet-400 hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to menu
                    </button>

                    <h3 className="text-base font-black text-white mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                      {faqs.map((faq, idx) => (
                        <div key={idx} className="p-4 border border-slate-900 bg-slate-900/10 rounded-2xl">
                          <h4 className="text-xs font-extrabold text-white mb-2 flex items-start gap-2">
                            <HelpCircle className="h-4 w-4 text-pink-400 flex-shrink-0 mt-0.5" />
                            <span>{faq.q}</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed pl-6">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
