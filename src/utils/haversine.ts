/**
 * Reusable Haversine distance and geospatial navigation utilities
 * Shared across the tracking engine, proximity detector, and ETA estimator.
 */

export const EARTH_RADIUS_METERS = 6371000;

// Configurable thresholds as per specification
export const THRESHOLD_ARRIVED_METERS = 100;
export const THRESHOLD_APPROACHING_METERS = 500;

/**
 * Calculates the great-circle distance between two points in meters using the Haversine formula
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calculates heading (compass bearing in degrees 0-360) from point 1 to point 2
 */
export function calculateBearingDegrees(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((bearing + 360) % 360);
}

/**
 * Computes Estimated Time of Arrival (ETA) in minutes based on distance and average speed
 * Defaulting to 30 km/h in urban college transit conditions if bus is idling or stopped.
 */
export function calculateEtaMinutes(distanceMeters: number, currentSpeedKmH: number): number {
  if (distanceMeters <= THRESHOLD_ARRIVED_METERS) {
    return 0;
  }
  // Assume a practical average speed of 30 km/h (8.33 m/s) if speed is too low (e.g. stopped at a light)
  const effectiveSpeedKmH = currentSpeedKmH > 10 ? currentSpeedKmH : 30;
  const speedMetersPerSecond = (effectiveSpeedKmH * 1000) / 3600;
  const seconds = distanceMeters / speedMetersPerSecond;
  return Math.max(1, Math.round(seconds / 60));
}
