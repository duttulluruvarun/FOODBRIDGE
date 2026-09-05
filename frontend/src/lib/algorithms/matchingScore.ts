export function calculateMatchScore(
  distanceKm: number,
  maxDistanceKm: number = 50,
  foodUrgencyHours: number,
  maxUrgencyHours: number = 48,
  donationSize: number,
  ngoCapacity: number,
  historicalAcceptanceRate: number = 0.8
): number {
  // 1. Distance Score (closer is better)
  const distanceScore = Math.max(0, 1 - (distanceKm / maxDistanceKm));

  // 2. Urgency Score (more urgent = higher score, but if already expired it drops)
  let urgencyScore = 0;
  if (foodUrgencyHours > 0) {
    urgencyScore = Math.max(0, 1 - (foodUrgencyHours / maxUrgencyHours));
  }

  // 3. Capacity Score (how perfectly it fits)
  // If donation size > capacity, it's a bad fit.
  // An NGO with no declared capacity (null/0/negative in the DB) cannot take
  // the donation, and dividing by it would yield NaN/Infinity that survives the
  // final clamp, so treat it as a zero fit up front.
  let capacityScore = 0;
  if (!ngoCapacity || ngoCapacity <= 0) {
    capacityScore = 0;
  } else if (donationSize <= ngoCapacity) {
    // Proportional fit
    capacityScore = donationSize / ngoCapacity;
  } else {
    // If it exceeds capacity, score drops significantly
    capacityScore = Math.max(0, 1 - ((donationSize - ngoCapacity) / ngoCapacity));
  }

  // Calculate final score
  const score = (
    0.35 * distanceScore +
    0.30 * urgencyScore +
    0.20 * capacityScore +
    0.15 * historicalAcceptanceRate
  );

  // Math.max(0, NaN) is NaN, so a non-finite input would otherwise escape the
  // clamp and propagate into callers as a NaN score.
  if (!Number.isFinite(score)) return 0;

  return Math.min(1, Math.max(0, score)); // ensure between 0 and 1
}
