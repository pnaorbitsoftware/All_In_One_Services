const labels = {
  unpaid: "Unpaid",
  order_created: "Order Created",
  paid: "Paid",
  failed: "Failed",
  penalty_applied: "Penalty Applied",
  rejected: "Rejected",
  refunded: "Refunded",
};

const colors = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
  unpaid: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200",
  order_created: "bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200",
  penalty_applied: "bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-200",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200",
  refunded: "bg-purple-100 text-purple-700 dark:bg-purple-400/10 dark:text-purple-200",
};

export default function PaymentStatusBadge({ status = "unpaid" }) {
  return (
    <span className={`h-fit rounded-full px-3 py-1 text-xs font-black ${colors[status] || colors.unpaid}`}>
      {labels[status] || status}
    </span>
  );
}
