const labels = {
  not_submitted: "Not Submitted",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const colors = {
  not_submitted:
    "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200",
  submitted:
    "bg-yellow-100 text-devyellow-700 dark:bg-yellow-400/10 dark:text-yellow-100",
  accepted:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200",
};

export default function EstimateStatusBadge({ status = "not_submitted" }) {
  return (
    <span
      className={`h-fit rounded-full px-3 py-1 text-xs font-black ${colors[status] || colors.not_submitted}`}
    >
      {labels[status] || status}
    </span>
  );
}
