export function generateDeliveryQR(matchId: string, volunteerId: string): string {
  // Returns a simple payload to be encoded into a QR code
  return JSON.stringify({
    matchId,
    volunteerId,
    timestamp: Date.now(),
    type: "DELIVERY_HANDOFF"
  });
}

export function verifyDeliveryQR(scannedData: string, expectedMatchId: string): boolean {
  try {
    const data = JSON.parse(scannedData);
    if (data.type === "DELIVERY_HANDOFF" && data.matchId === expectedMatchId) {
      // Validate timestamp is within last 1 hour
      if (Date.now() - data.timestamp < 3600000) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}
