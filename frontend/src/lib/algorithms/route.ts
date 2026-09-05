export interface LocationPoint {
  lat: number;
  lng: number;
  id: string;
}

export interface RouteOptimizationResult {
  optimizedOrder: LocationPoint[];
  totalDistanceKm: number;
  estimatedTimeMin: number;
  fuelSavedLiters: number;
  co2SavedKg: number;
}

export function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Haversine formula for distance
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

/**
 * A greedy nearest-neighbor approach to sort points for the route.
 */
export function optimizeRoute(start: LocationPoint, destinations: LocationPoint[]): RouteOptimizationResult {
  let currentLocation = start;
  const unvisited = [...destinations];
  const optimizedOrder: LocationPoint[] = [];
  let totalDistanceKm = 0;

  while (unvisited.length > 0) {
    // Find nearest neighbor
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistance(currentLocation.lat, currentLocation.lng, unvisited[i].lat, unvisited[i].lng);
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearestIndex = i;
      }
    }

    const nextLocation = unvisited[nearestIndex];
    optimizedOrder.push(nextLocation);
    totalDistanceKm += shortestDistance;
    currentLocation = nextLocation;
    unvisited.splice(nearestIndex, 1);
  }

  // Assuming average speed of 40 km/h in city
  const estimatedTimeMin = (totalDistanceKm / 40) * 60;
  
  // A standard car uses ~8 liters per 100km, so 0.08 L/km
  const fuelUsed = totalDistanceKm * 0.08;
  const fuelSavedLiters = fuelUsed * 0.3; // Assume 30% savings compared to unoptimized multiple trips

  // 1 liter of gasoline = ~2.31 kg of CO2
  const co2SavedKg = fuelSavedLiters * 2.31;

  return {
    optimizedOrder,
    totalDistanceKm,
    estimatedTimeMin,
    fuelSavedLiters,
    co2SavedKg
  };
}
