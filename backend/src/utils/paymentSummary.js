export const DEFAULT_PROVIDER_SHARE_PERCENT = Number(process.env.PROVIDER_SHARE_PERCENT || 80);
export const DEFAULT_ADMIN_COMMISSION_PERCENT = Math.max(0, 100 - DEFAULT_PROVIDER_SHARE_PERCENT);

export function getBookingPaymentAmount(booking) {
  return Number(booking.finalEstimateAmount || booking.costEstimate || 0);
}

export function getProviderPayoutAmount(booking) {
  const savedAmount = Number(booking.providerPayoutAmount || 0);
  if (savedAmount > 0) return savedAmount;

  const amount = getBookingPaymentAmount(booking);
  const sharePercent = Number(booking.providerSharePercent || DEFAULT_PROVIDER_SHARE_PERCENT);
  return Math.round((amount * sharePercent) / 100);
}

export function getAdminCommissionAmount(booking) {
  const savedAmount = Number(booking.adminCommissionAmount || 0);
  if (savedAmount > 0) return savedAmount;

  const amount = getBookingPaymentAmount(booking);
  return Math.max(amount - getProviderPayoutAmount(booking), 0);
}

export function applyPaymentSplit(booking) {
  const amount = getBookingPaymentAmount(booking);
  const providerSharePercent = Number(booking.providerSharePercent || DEFAULT_PROVIDER_SHARE_PERCENT);
  const providerPayoutAmount = Math.round((amount * providerSharePercent) / 100);
  const adminCommissionAmount = Math.max(amount - providerPayoutAmount, 0);

  booking.providerSharePercent = providerSharePercent;
  booking.adminCommissionPercent = Math.max(0, 100 - providerSharePercent);
  booking.providerPayoutAmount = providerPayoutAmount;
  booking.adminCommissionAmount = adminCommissionAmount;

  return {
    amount,
    providerSharePercent,
    adminCommissionPercent: booking.adminCommissionPercent,
    providerPayoutAmount,
    adminCommissionAmount,
  };
}

export function buildProviderPaymentSummary(bookings = []) {
  const providerBookings = Array.isArray(bookings) ? bookings : [];
  const paidBookings = providerBookings.filter((booking) => booking.clientPaymentStatus === "paid" || booking.paymentStatus === "paid");
  const completedBookings = paidBookings.filter((booking) => String(booking.status || "").toLowerCase() === "completed");
  const releasedBookings = paidBookings.filter((booking) => booking.adminPayoutStatus === "released");
  const pendingPayoutBookings = paidBookings.filter((booking) => booking.adminPayoutStatus !== "released");
  const awaitingClientPaymentBookings = providerBookings.filter((booking) => {
    const estimateAccepted = booking.estimateStatus === "accepted";
    const notPaid = booking.clientPaymentStatus !== "paid" && booking.paymentStatus !== "paid";
    return estimateAccepted && notPaid;
  });

  const adminReleased = releasedBookings.reduce(
    (total, booking) => total + getProviderPayoutAmount(booking),
    0
  );
  const alreadyWithdrawn = releasedBookings.reduce(
    (total, booking) => total + Number(booking.providerWithdrawnAmount || 0),
    0
  );
  const pendingEarnings = pendingPayoutBookings.reduce(
    (total, booking) => total + getProviderPayoutAmount(booking),
    0
  );
  const adminCommission = paidBookings.reduce(
    (total, booking) => total + getAdminCommissionAmount(booking),
    0
  );

  return {
    totalPaidEarnings: adminReleased,
    pendingEarnings,
    completedPaidBookings: completedBookings.length,
    awaitingClientPayment: awaitingClientPaymentBookings.length,
    adminReleased,
    adminCommission,
    alreadyWithdrawn,
    availableToWithdraw: Math.max(adminReleased - alreadyWithdrawn, 0),
    providerSharePercent: DEFAULT_PROVIDER_SHARE_PERCENT,
    adminCommissionPercent: DEFAULT_ADMIN_COMMISSION_PERCENT,
  };
}
