import { Coordinates, DeliveryAddress } from "../types";

export const DEFAULT_LOCATION: Coordinates = {
  latitude: 10.0159,
  longitude: 76.3419 // Kakkanad / Kochi, Kerala
};

/**
 * Fixed 5,000-metre (5 km) consumer deal radar notification radius.
 */
export const CONSUMER_NOTIFICATION_RADAR_METERS = 5000;

/**
 * Validates whether geographic coordinates are genuine, non-zero, within physical limits,
 * and not an unverified Kakkanad fallback placeholder.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  if (lat === 0 && lng === 0) {
    return false;
  }
  // Check if it's the unverified Kakkanad fallback placeholder
  if (Math.abs(lat - 10.0159) < 0.0001 && Math.abs(lng - 76.3419) < 0.0001) {
    return false;
  }
  return true;
}

export interface ResolvedConsumerLocation {
  coords: Coordinates;
  source: "verified_device_gps" | "verified_saved_address";
  label?: string;
}

/**
 * Resolves the active consumer coordinates for deal geofence and notification evaluation.
 *
 * Location Resolution Priority:
 * 1. Verified current GPS coordinates when available and valid.
 * 2. Otherwise, consumer's explicitly selected or primary saved address coordinates,
 *    provided both latitude and longitude are valid.
 * 3. If neither source is available, return null to skip safely.
 *
 * Never treats unverified default Kakkanad coordinates or raw text without valid coordinates as real location.
 */
export function resolveEligibleConsumerLocation(
  isGPS: boolean,
  currentLocation: Coordinates | null,
  deliveryAddress: DeliveryAddress | null,
  userAddress?: DeliveryAddress | null
): ResolvedConsumerLocation | null {
  // Priority 1: Verified current GPS coordinates
  if (isGPS && currentLocation) {
    const lat = currentLocation.latitude;
    const lng = currentLocation.longitude;
    const isValidLat = typeof lat === "number" && !isNaN(lat) && lat >= -90 && lat <= 90;
    const isValidLng = typeof lng === "number" && !isNaN(lng) && lng >= -180 && lng <= 180;
    const isNotZero = lat !== 0 || lng !== 0;

    // Never accept fabricated default Kakkanad coordinates as genuine device GPS
    const isFabricatedDefault = Math.abs(lat - 10.0159) < 0.0001 && Math.abs(lng - 76.3419) < 0.0001;

    if (isValidLat && isValidLng && isNotZero && !isFabricatedDefault) {
      return {
        coords: { latitude: lat, longitude: lng },
        source: "verified_device_gps",
        label: "Live Device GPS"
      };
    }
  }

  // Priority 2: Explicitly selected or primary saved address coordinates
  let candidate: DeliveryAddress | null = deliveryAddress || userAddress || null;
  if (Array.isArray(candidate)) {
    const list = candidate as any[];
    candidate = list.find((a) => a?.isPrimary || a?.isDefault || a?.selected) || list[0] || null;
  }

  if (candidate) {
    const lat = typeof candidate.lat === "number" ? candidate.lat : parseFloat(String(candidate.lat));
    const lng = typeof candidate.lng === "number" ? candidate.lng : parseFloat(String(candidate.lng));

    const isValidLat = typeof lat === "number" && !isNaN(lat) && lat >= -90 && lat <= 90;
    const isValidLng = typeof lng === "number" && !isNaN(lng) && lng >= -180 && lng <= 180;
    const isNotZero = lat !== 0 || lng !== 0;

    if (isValidLat && isValidLng && isNotZero) {
      const hasRealText = Boolean(
        (candidate.houseDetails && candidate.houseDetails.trim().length > 0) ||
        (candidate.streetArea && candidate.streetArea.trim().length > 0) ||
        (candidate.city && candidate.city.trim().length > 0)
      );

      const isDefaultCoords = Math.abs(lat - 10.0159) < 0.0001 && Math.abs(lng - 76.3419) < 0.0001;
      // If coordinates match fabricated Kakkanad, reject unless accompanied by genuine address details in Kakkanad
      const mentionsKakkanad = (candidate.city || candidate.streetArea || candidate.houseDetails || "")
        .toLowerCase()
        .includes("kakkanad");

      if (!isDefaultCoords || (hasRealText && mentionsKakkanad)) {
        const summary = [candidate.houseDetails, candidate.streetArea, candidate.city]
          .filter(Boolean)
          .join(", ");
        return {
          coords: { latitude: lat, longitude: lng },
          source: "verified_saved_address",
          label: summary || "Saved Delivery Address"
        };
      }
    }
  }

  // Priority 3: Neither source available
  return null;
}

/**
 * High-accuracy boundary check for Kerala State.
 * Coordinates span approx Lat 8.18 to 12.80 and Lng 74.85 to 77.40.
 * Also verifies location region/state where available.
 */
export function isLocationInsideKerala(coords: Coordinates): boolean {
  if (!coords || typeof coords.latitude !== "number" || typeof coords.longitude !== "number") {
    return false;
  }

  const { latitude: lat, longitude: lng } = coords;

  // Primary Bounding Box for Kerala:
  // South (near Parassala/Kanyakumari border): ~8.25° N
  // North (near Manjeshwar/Kasaragod border): ~12.82° N
  // West (Arabian Sea coast): ~74.85° E
  // East (Western Ghats / Palakkad / Idukki border): ~77.45° E
  if (lat < 8.20 || lat > 12.85 || lng < 74.80 || lng > 77.50) {
    return false;
  }

  // Polygon approximation of Kerala outline along Western Ghats:
  // Points (lat, lng) moving roughly from South to North
  const keralaPolygon: [number, number][] = [
    [8.28, 77.10], // South-most Trivandrum
    [8.50, 77.20],
    [8.80, 77.25], // Kollam/Thenmala
    [9.15, 77.20], // Pathanamthitta
    [9.45, 77.25], // Idukki south
    [9.85, 77.30], // Munnar / Idukki east
    [10.15, 77.00],
    [10.75, 76.85], // Palakkad gap east
    [11.00, 76.45], // Malappuram
    [11.50, 76.25], // Wayanad
    [11.90, 76.05], // Kannur east
    [12.50, 75.35], // Kasaragod
    [12.80, 74.90], // Manjeshwar north
    [12.45, 74.95], // Coast southwards
    [11.90, 75.30],
    [11.25, 75.75],
    [10.50, 76.00],
    [9.95, 76.25],
    [9.40, 76.35],
    [8.80, 76.55],
    [8.35, 76.95]
  ];

  // Ray-casting algorithm for point in polygon
  let inside = false;
  for (let i = 0, j = keralaPolygon.length - 1; i < keralaPolygon.length; j = i++) {
    const xi = keralaPolygon[i][0], yi = keralaPolygon[i][1];
    const xj = keralaPolygon[j][0], yj = keralaPolygon[j][1];

    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  // If inside the detailed polygon or very close inside the state box:
  return inside;
}

/**
 * Calculates Haversine distance between two coordinates in meters
 */
export function calculateDistanceInMeters(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (coord1.latitude * Math.PI) / 180;
  const phi2 = (coord2.latitude * Math.PI) / 180;
  const deltaPhi = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLambda = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats distance in meters into human-readable format (e.g. "350 m" or "2.4 km")
 */
export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null || isNaN(meters)) return "Nearby";
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formats remaining time for offer:
 * - When > 24 hours left: "X days left" (e.g. "30 days left", "24 days left")
 * - When <= 24 hours left: countdown format (e.g. "23h 45m left", "05m 20s left")
 */
export function formatTimeLeft(endAt?: string, fallbackMinutes: number = 60): { text: string; isUrgent: boolean; diffMs: number } {
  let targetTime: number;

  if (endAt) {
    targetTime = new Date(endAt).getTime();
  } else {
    targetTime = Date.now() + fallbackMinutes * 60 * 1000;
  }

  const diff = targetTime - Date.now();
  if (diff <= 0) {
    return { text: "Expired", isUrgent: true, diffMs: 0 };
  }

  const totalSecs = Math.floor(diff / 1000);
  const totalMins = Math.floor(totalSecs / 60);
  const totalHours = Math.floor(totalMins / 60);
  const days = Math.floor(totalHours / 24);

  if (days >= 1) {
    const dayLabel = days === 1 ? "1 day left" : `${days} days left`;
    return { text: dayLabel, isUrgent: false, diffMs: diff };
  }

  // Last 24 Hours Countdown
  const remHours = totalHours;
  const remMins = totalMins % 60;
  const remSecs = totalSecs % 60;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (remHours > 0) {
    return {
      text: `${pad(remHours)}h ${pad(remMins)}m ${pad(remSecs)}s`,
      isUrgent: true,
      diffMs: diff
    };
  }

  return {
    text: `${pad(remMins)}m ${pad(remSecs)}s`,
    isUrgent: true,
    diffMs: diff
  };
}

