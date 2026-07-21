import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export default function RejectEstimateModal({ booking, onReject, onClose }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onReject(reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/70 p-4 backdrop-blur" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form onSubmit={submit} onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.97 }} className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-200">
              <AlertTriangle size={22} />
            </div>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-orange-600">Reject estimate</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{booking.service}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">A Rs. 200 rejection penalty will be applied.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"><X size={18} /></button>
        </div>
        <label className="mt-5 grid gap-2 font-bold">
          Rejection reason
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows="5" placeholder="Amount is too high" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 dark:border-white/10 dark:bg-slate-950" />
        </label>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white">Keep estimate</button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-orange-600 px-5 py-3 font-black text-white shadow-lg shadow-orange-600/15 transition hover:-translate-y-0.5 disabled:opacity-60">
            {submitting ? "Applying..." : "Reject Estimate"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
