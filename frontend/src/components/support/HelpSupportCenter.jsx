import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Headphones,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Send,
  Ticket,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const categories = ["Technical Issue", "Payment Issue", "Service Issue", "Account Issue", "Other"];
const priorities = ["Low", "Medium", "High"];

const statusTone = {
  Open: "bg-blue-50 text-blue-700 border-blue-100",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-100",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Closed: "bg-slate-100 text-slate-600 border-slate-200",
};

const priorityTone = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-rose-50 text-rose-700",
};

const getToken = () => localStorage.getItem("servicehub_token") || "";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "";

const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
};

export function MySupportTicketsPanel({ limit = 4 }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    if (!getToken()) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/support/tickets?limit=${limit}`);
      setTickets(data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadTickets, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="mt-6 rounded-[1.35rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">My Support Tickets</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">
            Track status, priority, issue details, and admin responses.
          </p>
        </div>
        <button
          type="button"
          onClick={loadTickets}
          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white dark:bg-amber-300 dark:text-slate-950"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:bg-white/5">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading support tickets...
          </div>
        ) : tickets.length ? (
          tickets.map((ticket) => (
            <article key={ticket.ticketId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700 dark:text-blue-200">
                    {ticket.ticketId}
                  </p>
                  <h3 className="mt-1 text-base font-black text-slate-950 dark:text-white">{ticket.category}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300 line-clamp-2">
                    {ticket.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone[ticket.status] || statusTone.Open}`}>
                    {ticket.status}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${priorityTone[ticket.priority] || priorityTone.Medium}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
              {ticket.adminResponse && (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                  <strong>Admin response:</strong> {ticket.adminResponse}
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm font-bold text-slate-500 dark:border-white/10 dark:text-slate-300">
            No support tickets yet.
          </div>
        )}
      </div>
    </section>
  );
}

export default function HelpSupportCenter({ user, onLogin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState("home");
  const [faqs, setFaqs] = useState([]);
  const [faqSearch, setFaqSearch] = useState("");
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    category: "Technical Issue",
    priority: "Medium",
    description: "",
  });

  const canUseSupport = ["user", "provider"].includes(user?.role);
  const filteredFaqs = useMemo(() => faqs, [faqs]);

  const showToast = (message, success = true) => {
    setToast({ message, success });
    window.setTimeout(() => setToast(null), 4000);
  };

  const loadFaqs = async (search = faqSearch) => {
    try {
      const data = await apiFetch(`/support/faqs${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setFaqs(data.faqs || []);
    } catch {
      setFaqs([]);
    }
  };

  const loadTickets = async () => {
    if (!canUseSupport) return;
    setLoading(true);
    try {
      const data = await apiFetch("/support/tickets?limit=50");
      setTickets(data.tickets || []);
    } catch (error) {
      showToast(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/support/tickets/${ticketId}`);
      setSelectedTicket(data.ticket);
      setMessages(data.messages || []);
      setScreen("detail");
    } catch (error) {
      showToast(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = window.setTimeout(() => loadFaqs(""), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || screen !== "tickets") return undefined;
    const timer = window.setTimeout(loadTickets, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, screen]);

  const openCreate = () => {
    if (!getToken() || !canUseSupport) {
      showToast("Please log in as a user or provider to submit a ticket.", false);
      onLogin?.();
      return;
    }
    setScreen("create");
  };

  const submitTicket = async (event) => {
    event.preventDefault();
    if (!getToken() || !canUseSupport) {
      showToast("Please log in as a user or provider to submit a ticket.", false);
      onLogin?.();
      return;
    }

    const description = form.description.trim();

    if (description.length < 10) {
      showToast("Please describe the issue in at least 10 characters.", false);
      return;
    }

    if (description.length > 500) {
      showToast("Issue Description cannot exceed 500 characters.", false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch("/support/tickets", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ category: "Technical Issue", priority: "Medium", description: "" });
      showToast(`Ticket ${data.ticketId} created successfully.`);
      await loadTickets();
      setScreen("tickets");
    } catch (error) {
      showToast(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      [field]: field === "description" ? value.slice(0, 500) : value,
    }));
  };

  const contactOptions = [
    { title: "Create Ticket", copy: "Expect a response within 1-2 business days", icon: Mail, action: openCreate },
    { title: "WhatsApp Chat", copy: "Instant support (10 AM - 7 PM)", icon: MessageCircle, action: () => window.open("https://wa.me/919999999999", "_blank") },
    { title: "Request Callback", copy: "One of our specialists will reach out shortly.", icon: Phone, action: openCreate },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-[80] inline-flex h-14 items-center gap-3 rounded-full bg-[#2f4263] px-6 text-white shadow-[0_16px_34px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:bg-[#263957]"
      >
        <Headphones className="h-5 w-5" />
        <span className="hidden text-sm font-black sm:inline">Help & Support</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/62 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={(event) => event.stopPropagation()}
              className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#f6f7fb] text-slate-900 shadow-2xl"
            >
              <div className="bg-[#0d1628] px-7 py-7 text-white">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close Help Center"
                >
                  <X size={22} />
                </button>

                {screen === "create" ? (
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600">
                      <Ticket size={25} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">Submit a Ticket</h2>
                      <p className="mt-1 font-semibold text-slate-300">We usually respond within 24 hours.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-black">Help Center</h2>
                    <p className="mt-2 font-semibold text-slate-300">How can we help you today?</p>
                    <button
                      type="button"
                      onClick={openCreate}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20"
                    >
                      <Ticket size={18} /> Submit Ticket
                    </button>
                  </>
                )}
              </div>

              {toast && (
                <div className={`mx-6 mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm font-bold ${toast.success ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
                  {toast.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span>{toast.message}</span>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {screen === "home" && (
                  <div className="space-y-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={faqSearch}
                        onChange={(event) => {
                          setFaqSearch(event.target.value);
                          loadFaqs(event.target.value);
                        }}
                        placeholder="Search for answers..."
                        className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-base font-bold outline-none transition focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <p className="mb-4 text-sm font-black uppercase tracking-[0.12em] text-slate-500">Popular FAQs</p>
                      <div className="space-y-3">
                        {filteredFaqs.map((faq) => (
                          <details key={faq._id} className="group rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-black marker:hidden">
                              {faq.question}
                              <ChevronRight className="h-5 w-5 text-slate-400 transition group-open:rotate-90" />
                            </summary>
                            <p className="px-5 pb-5 text-sm font-semibold leading-6 text-slate-600">{faq.answer}</p>
                          </details>
                        ))}
                        {!filteredFaqs.length && (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-500">
                            No FAQs matched your search.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {screen === "contact" && (
                  <div className="space-y-5">
                    <button type="button" onClick={() => setScreen("home")} className="inline-flex items-center gap-2 text-sm font-black text-slate-500">
                      <ArrowLeft size={17} /> Back to FAQs
                    </button>
                    {contactOptions.map((option) => (
                      <button
                        key={option.title}
                        type="button"
                        onClick={option.action}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <span className="flex items-center gap-4">
                          <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-blue-600">
                            <option.icon size={23} />
                          </span>
                          <span>
                            <strong className="block text-lg">{option.title}</strong>
                            <span className="text-sm font-semibold text-slate-500">{option.copy}</span>
                          </span>
                        </span>
                        <ChevronRight className="text-slate-300" />
                      </button>
                    ))}
                  </div>
                )}

                {screen === "create" && (
                  <form onSubmit={submitTicket} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-black">
                        Issue Category
                        <select value={form.category} onChange={updateForm("category")} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-blue-400">
                          {categories.map((category) => <option key={category}>{category}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-black">
                        Priority
                        <select value={form.priority} onChange={updateForm("priority")} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-blue-400">
                          {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                        </select>
                      </label>
                    </div>
                    <label className="grid gap-2 text-sm font-black">
                      <span className="flex items-center justify-between">
                        Issue Description
                        <span className="text-slate-400">{form.description.length}/500</span>
                      </span>
                      <textarea
                        required
                        minLength={10}
                        maxLength={500}
                        value={form.description}
                        onChange={updateForm("description")}
                        placeholder="Hi, I'm facing an issue with..."
                        rows={7}
                        className="resize-none rounded-xl border border-slate-300 bg-white px-4 py-4 text-base font-semibold leading-7 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                      />
                    </label>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-700">
                      Tip: Your name, email, and phone are fetched from your logged-in account automatically.
                    </div>
                    <button
                      type="submit"
                      disabled={loading || form.description.trim().length < 10}
                      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={20} />}
                      Submit Ticket
                    </button>
                  </form>
                )}

                {screen === "tickets" && (
                  <div>
                    <button type="button" onClick={() => setScreen("home")} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-500">
                      <ArrowLeft size={17} /> Back to FAQs
                    </button>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>
                      ) : tickets.length ? (
                        tickets.map((ticket) => (
                          <button
                            key={ticket.ticketId}
                            type="button"
                            onClick={() => loadTicketDetails(ticket.ticketId)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">{ticket.ticketId}</p>
                                <h3 className="mt-1 font-black">{ticket.category}</h3>
                                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{ticket.description}</p>
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone[ticket.status] || statusTone.Open}`}>{ticket.status}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center font-bold text-slate-500">
                          No support tickets yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {screen === "detail" && selectedTicket && (
                  <div>
                    <button type="button" onClick={() => setScreen("tickets")} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-500">
                      <ArrowLeft size={17} /> Back to tickets
                    </button>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">{selectedTicket.ticketId}</p>
                          <h3 className="mt-1 text-xl font-black">{selectedTicket.category}</h3>
                          <p className="mt-1 text-sm font-bold text-slate-500">{formatDate(selectedTicket.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone[selectedTicket.status] || statusTone.Open}`}>{selectedTicket.status}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${priorityTone[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                        </div>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">{selectedTicket.description}</p>
                      {selectedTicket.adminResponse && (
                        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
                          <strong>Admin response:</strong> {selectedTicket.adminResponse}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 space-y-3">
                      {messages.map((message) => (
                        <div key={message._id} className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black">{message.senderRole === "admin" ? "Support Desk" : message.senderId?.name || "You"}</p>
                            <span className="text-xs font-bold text-slate-400">{formatDate(message.createdAt)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {screen === "home" && (
                <div className="border-t border-slate-100 bg-white px-7 py-5 text-center">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Still need help?</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!getToken() || !canUseSupport) {
                          showToast("Please log in as a user or provider to view support tickets.", false);
                          onLogin?.();
                          return;
                        }
                        setScreen("tickets");
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-black text-slate-700"
                    >
                      <Clock size={18} /> My Tickets
                    </button>
                    <button type="button" onClick={() => setScreen("contact")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-600/20">
                      <Headphones size={18} /> Contact Us
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
