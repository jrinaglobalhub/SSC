import {
  calculateDistanceInMeters,
  isValidCoordinate,
  CONSUMER_NOTIFICATION_RADAR_METERS,
  resolveEligibleConsumerLocation
} from "../src/utils/geo";
import { DeliveryAddress, Coordinates } from "../src/types";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`FAIL: ${msg}`);
  }
  console.log(`PASS: ${msg}`);
}

console.log("=== RUNNING DEAL RADAR & LOCATION VERIFICATION TESTS ===");

// -------------------------------------------------------------
// Test 1: Coordinate Validation
// -------------------------------------------------------------
console.log("\n--- Group 1: Coordinate Validation ---");
assert(!isValidCoordinate(undefined, undefined), "undefined coordinates are invalid");
assert(!isValidCoordinate(NaN, NaN), "NaN coordinates are invalid");
assert(!isValidCoordinate(0, 0), "(0, 0) coordinates are invalid");
assert(!isValidCoordinate(10.0159, 76.3419), "Fabricated Kakkanad fallback (10.0159, 76.3419) is rejected");
assert(isValidCoordinate(9.9981, 76.2999), "Genuine Kochi coordinates (9.9981, 76.2999) are valid");
assert(isValidCoordinate(8.5241, 76.9366), "Trivandrum coordinates (8.5241, 76.9366) are valid");

// -------------------------------------------------------------
// Test 2: Consumer Location Resolution Priorities
// -------------------------------------------------------------
console.log("\n--- Group 2: Consumer Location Resolution Priorities ---");

// Priority 1: Verified current GPS coordinates
const liveGPS: Coordinates = { latitude: 9.9981, longitude: 76.2999 };
const resGPS = resolveEligibleConsumerLocation(true, liveGPS, null, null);
assert(resGPS !== null, "Verified GPS is accepted");
assert(resGPS?.source === "verified_device_gps", "Source is verified_device_gps");
assert(resGPS?.coords.latitude === 9.9981, "Lat matches GPS");

// Fabricated Kakkanad GPS must be rejected
const fakeGPS: Coordinates = { latitude: 10.0159, longitude: 76.3419 };
const resFakeGPS = resolveEligibleConsumerLocation(true, fakeGPS, null, null);
assert(resFakeGPS === null, "Fabricated Kakkanad coordinates are rejected even if isGPS is true");

// Priority 2: GPS unavailable, but valid saved address exists
const savedAddr: DeliveryAddress = {
  fullName: "Rahul Varma",
  phone: "9876543210",
  houseDetails: "Flat 4B, Skyline Apts",
  streetArea: "Palarivattom",
  city: "Kochi",
  district: "Ernakulam",
  pincode: "682025",
  addressType: "Home",
  lat: 10.0055,
  lng: 76.3050
};
const resAddr = resolveEligibleConsumerLocation(false, null, savedAddr, null);
assert(resAddr !== null, "Saved address used when GPS unavailable");
assert(resAddr?.source === "verified_saved_address", "Source is verified_saved_address");
assert(resAddr?.coords.latitude === 10.0055, "Lat matches saved address");

// Priority 3: Neither GPS nor valid saved address available
const emptyAddr: DeliveryAddress = {
  fullName: "Test User",
  phone: "9876543210",
  houseDetails: "",
  streetArea: "",
  city: "",
  district: "",
  pincode: "",
  addressType: "Home",
  lat: 0,
  lng: 0
};
const resNone = resolveEligibleConsumerLocation(false, null, emptyAddr, null);
assert(resNone === null, "Returns null when no valid location source exists");

// -------------------------------------------------------------
// Test 3: Fixed 5,000m (5 km) Deal Radar Eligibility
// -------------------------------------------------------------
console.log("\n--- Group 3: 5,000-metre Deal Radar Eligibility ---");
assert(CONSUMER_NOTIFICATION_RADAR_METERS === 5000, "CONSUMER_NOTIFICATION_RADAR_METERS is strictly 5,000 metres");

// Consumer at Marine Drive, Kochi (9.9816, 76.2750)
const consumerLocation: Coordinates = { latitude: 9.9816, longitude: 76.2750 };

// Scenario A: Store at MG Road, Kochi (~2.1 km away) -> WITHIN 5 KM
const storeNear: Coordinates = { latitude: 9.9690, longitude: 76.2890 };
const distNear = calculateDistanceInMeters(consumerLocation, storeNear);
console.log(`Calculated near distance: ${distNear}m`);
assert(distNear <= 5000, `Scenario A: Deal at ${distNear}m is <= 5,000m (ELIGIBLE)`);

// Scenario B: Store at Aluva (~18 km away) -> BEYOND 5 KM
const storeFar: Coordinates = { latitude: 10.1076, longitude: 76.3516 };
const distFar = calculateDistanceInMeters(consumerLocation, storeFar);
console.log(`Calculated far distance: ${distFar}m`);
assert(distFar > 5000, `Scenario B: Deal at ${distFar}m is > 5,000m (SUPPRESSED)`);

// Scenario B2: Boundary test at 5,001m
// 1 deg latitude is approx 111,000m -> 0.045 deg is approx 4,995m, 0.046 deg is approx 5,106m
const storeJustOver: Coordinates = {
  latitude: consumerLocation.latitude + 0.046,
  longitude: consumerLocation.longitude
};
const distJustOver = calculateDistanceInMeters(consumerLocation, storeJustOver);
console.log(`Boundary test (just over): ${distJustOver}m`);
assert(distJustOver > 5000, `Boundary test at ${distJustOver}m is > 5,000m (SUPPRESSED)`);

// -------------------------------------------------------------
// Test 4: 200-Item Bounded LRU Deduplication
// -------------------------------------------------------------
console.log("\n--- Group 4: 200-Item Bounded LRU Deduplication ---");
const processedIds = new Set<string>();

function processDealWithDeduplication(offerId: string): boolean {
  if (processedIds.has(offerId)) {
    return false; // Suppress duplicate
  }
  processedIds.add(offerId);
  if (processedIds.size > 200) {
    const firstKey = processedIds.keys().next().value;
    if (firstKey) processedIds.delete(firstKey);
  }
  return true; // Newly processed
}

// First event for offer_101
assert(processDealWithDeduplication("offer_101") === true, "First event for offer_101 processed");
// Duplicate event for offer_101
assert(processDealWithDeduplication("offer_101") === false, "Duplicate event for offer_101 suppressed");

// Insert 200 more offers (offer_102 to offer_301)
for (let i = 102; i <= 301; i++) {
  processDealWithDeduplication(`offer_${i}`);
}
assert(processedIds.size === 200, "LRU cache bounded at maximum 200 items");
// offer_101 was evicted by LRU capacity
assert(!processedIds.has("offer_101"), "Oldest item offer_101 evicted when cache exceeded 200 items");
assert(processedIds.has("offer_301"), "Newest item offer_301 remains in cache");

console.log("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉");
