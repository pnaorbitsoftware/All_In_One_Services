export default function PaymentSummaryCard({ title, amount, icon: Icon, description }) {
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-500 dark:text-slate-300">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{amount}</p>
        </div>
        {Icon && (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
            <Icon size={21} />
          </div>
        )}
      </div>
      {description && <p className="mt-3 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{description}</p>}
    </div>
  );
}
