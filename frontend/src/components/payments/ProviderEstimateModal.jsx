import { motion } from "framer-motion";
import { IndianRupee, X } from "lucide-react";
import { useState } from "react";

export default function ProviderEstimateModal({ booking, onSubmit, onClose }) {
  const [amount, setAmount] = useState(booking?.finalEstimateAmount || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isUpdate = Boolean(booking?.finalEstimateAmount);

  const submit = async (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit(numericAmount);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/70 p-4 backdrop-blur" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form onSubmit={submit} onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.97 }} className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-teal-600">{isUpdate ? "Update final estimate" : "Final estimate"}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{booking.service}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">{booking.name} | {booking.phone}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"><X size={18} /></button>
        </div>
        <label className="mt-6 grid gap-2 font-bold">
          Final amount
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-teal-400 dark:border-white/10 dark:bg-slate-950">
            <IndianRupee size={18} className="text-teal-700" />
            <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" placeholder="1500" className="min-w-0 flex-1 bg-transparent outline-none" />
          </div>
        </label>
        {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-teal-600/15 transition hover:-translate-y-0.5 disabled:opacity-60">
            {submitting ? "Sending..." : isUpdate ? "Update Estimate" : "Send Estimate to Client"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
