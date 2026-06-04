export const DEFAULT_PROVIDER_SHARE_PERCENT = Number(process.env.PROVIDER_SHARE_PERCENT || 80);

export function getProviderPayoutAmount(booking) {
  const savedAmount = Number(booking.providerPayoutAmount || 0);
  if (savedAmount > 0) return savedAmount;

  const costEstimate = Number(booking.costEstimate || 0);
  const sharePercent = Number(booking.providerSharePercent || DEFAULT_PROVIDER_SHARE_PERCENT);
  return Math.round((costEstimate * sharePercent) / 100);
}

export function buildProviderPaymentSummary(bookings = []) {
  const providerBookings = Array.isArray(bookings) ? bookings : [];
  const completedBookings = providerBookings.filter((booking) => booking.status === "completed");
  const releasedBookings = completedBookings.filter(
    (booking) => booking.adminPayoutStatus === "released"
  );
  const pendingPayoutBookings = completedBookings.filter(
    (booking) => booking.adminPayoutStatus !== "released"
  );
  const awaitingClientPaymentBookings = providerBookings.filter((booking) => {
    const status = String(booking.status || "");
    return (
      ["accepted", "assigned", "confirmed"].includes(status) &&
      booking.clientPaymentStatus !== "paid"
    );
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

  return {
    totalPaidEarnings: adminReleased,
    pendingEarnings,
    completedPaidBookings: releasedBookings.length,
    awaitingClientPayment: awaitingClientPaymentBookings.length,
    adminReleased,
    alreadyWithdrawn,
    availableToWithdraw: Math.max(adminReleased - alreadyWithdrawn, 0),
    providerSharePercent: DEFAULT_PROVIDER_SHARE_PERCENT,
  };
}
