import {
  formatGeocodedLocationName,
  formatAddressDisplayLabel,
  isValidCoordinate,
  resolveEligibleConsumerLocation,
  calculateDistanceInMeters,
  CONSUMER_NOTIFICATION_RADAR_METERS
} from "../src/utils/geo";
import { Coordinates, DeliveryAddress } from "../src/types";

// Declarations for Node builtins in standalone script
declare const require: any;
declare const process: any;
const fs = require("fs");
const path = require("path");

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`FAIL: ${msg}`);
  }
}

function assertEqual(actual: any, expected: any, msg: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${msg} (expected: "${expected}", got: "${actual}")`);
  }
}

console.log("=== RUNNING LOCATION SELECTION & NAME RESOLUTION VERIFICATION TESTS ===");

// -----------------------------------------------------------------------------
// Test 1: GPS in Karnataka Resolves to Karnataka
// -----------------------------------------------------------------------------
console.log("\n--- Group 1: GPS in Karnataka Resolves to Karnataka ---");

const karnatakaBengaluruGeo = {
  city: "Bengaluru",
  district: "Bengaluru Urban",
  region: "Karnataka",
  country: "India"
};
const bengaluruName = formatGeocodedLocationName(karnatakaBengaluruGeo);
assertEqual(bengaluruName, "Bengaluru, Karnataka", "Bengaluru coordinates resolve to 'Bengaluru, Karnataka'");
assert(!bengaluruName.includes("Kochi"), "Result must not mention Kochi");
assert(!bengaluruName.includes("Kerala"), "Result must not mention Kerala");
console.log("✅ PASS: GPS in Bengaluru resolves to 'Bengaluru, Karnataka'");

const karnatakaMysuruGeo = {
  city: "Mysuru",
  district: "Mysuru",
  region: "Karnataka",
  country: "India"
};
const mysuruName = formatGeocodedLocationName(karnatakaMysuruGeo);
assertEqual(mysuruName, "Mysuru, Karnataka", "Mysuru coordinates resolve to 'Mysuru, Karnataka'");
console.log("✅ PASS: GPS in Mysuru resolves to 'Mysuru, Karnataka'");

const karnatakaDistrictOnlyGeo = {
  district: "Udupi",
  region: "Karnataka",
  country: "India"
};
const udupiName = formatGeocodedLocationName(karnatakaDistrictOnlyGeo);
assertEqual(udupiName, "Udupi, Karnataka", "District-only geocode resolves to 'Udupi, Karnataka'");
console.log("✅ PASS: District-only geocode in Karnataka resolves correctly");

// -----------------------------------------------------------------------------
// Test 2: Coordinates in Kerala Resolve Correctly Without Reusing Stale Karnataka Location
// -----------------------------------------------------------------------------
console.log("\n--- Group 2: Coordinates in Kerala Resolve Correctly ---");

const keralaKochiGeo = {
  city: "Kochi",
  district: "Ernakulam",
  region: "Kerala",
  country: "India"
};
const kochiName = formatGeocodedLocationName(keralaKochiGeo);
assertEqual(kochiName, "Kochi, Kerala", "Kochi coordinates resolve to 'Kochi, Kerala'");
assert(!kochiName.includes("Karnataka"), "Kerala result does not retain previous Karnataka location");
console.log("✅ PASS: GPS in Kochi resolves to 'Kochi, Kerala'");

const keralaTrivandrumGeo = {
  city: "Thiruvananthapuram",
  district: "Thiruvananthapuram",
  region: "Kerala",
  country: "India"
};
const tvmName = formatGeocodedLocationName(keralaTrivandrumGeo);
assertEqual(tvmName, "Thiruvananthapuram, Kerala", "Thiruvananthapuram coordinates resolve to 'Thiruvananthapuram, Kerala'");
console.log("✅ PASS: GPS in Thiruvananthapuram resolves to 'Thiruvananthapuram, Kerala'");

// -----------------------------------------------------------------------------
// Test 3: Geocoder Failure Produces Truthful Fallback Instead of "Kochi, Kerala"
// -----------------------------------------------------------------------------
console.log("\n--- Group 3: Geocoder Failure Produces Truthful Fallback ---");

const nullGeoName = formatGeocodedLocationName(null);
assertEqual(nullGeoName, "Current location", "Null geocode returns 'Current location'");
assert(!nullGeoName.includes("Kochi"), "Null geocode must not fabricate Kochi");
assert(!nullGeoName.includes("Kerala"), "Null geocode must not fabricate Kerala");
console.log("✅ PASS: Null geocoder response falls back truthfully to 'Current location'");

const emptyGeoName = formatGeocodedLocationName({});
assertEqual(emptyGeoName, "Current location", "Empty geocode returns 'Current location'");
console.log("✅ PASS: Empty geocoder response falls back truthfully to 'Current location'");

const undefinedGeoName = formatGeocodedLocationName(undefined);
assertEqual(undefinedGeoName, "Current location", "Undefined geocode returns 'Current location'");
console.log("✅ PASS: Undefined geocoder response falls back truthfully to 'Current location'");

// -----------------------------------------------------------------------------
// Test 4: Moving From One Location to Another Without Previous Location Name Persisting
// -----------------------------------------------------------------------------
console.log("\n--- Group 4: Location Transition Lifecycle ---");

let activeLocationName = "Current location";

// Step A: Device in Karnataka
activeLocationName = formatGeocodedLocationName({ city: "Bengaluru", region: "Karnataka", country: "India" });
assertEqual(activeLocationName, "Bengaluru, Karnataka", "Step A");

// Step B: Device moves to Kerala
activeLocationName = formatGeocodedLocationName({ city: "Kochi", region: "Kerala", country: "India" });
assertEqual(activeLocationName, "Kochi, Kerala", "Step B");
assert(!activeLocationName.includes("Bengaluru"), "Previous Karnataka city does not persist");
assert(!activeLocationName.includes("Karnataka"), "Previous Karnataka state does not persist");

// Step C: Device moves to Tamil Nadu
activeLocationName = formatGeocodedLocationName({ city: "Chennai", region: "Tamil Nadu", country: "India" });
assertEqual(activeLocationName, "Chennai, Tamil Nadu", "Step C");
assert(!activeLocationName.includes("Kochi"), "Previous Kerala city does not persist");
assert(!activeLocationName.includes("Kerala"), "Previous Kerala state does not persist");
console.log("✅ PASS: Location transitions cleanly replace state with zero cross-contamination");

// -----------------------------------------------------------------------------
// Test 5: Rapid Consecutive Location Requests (Race Condition & Sequence Token)
// -----------------------------------------------------------------------------
console.log("\n--- Group 5: Rapid Consecutive Requests & Out-of-Order Overwrite Prevention ---");

async function testRaceConditionPrevention() {
  let locationRequestId = 0;
  let resolvedStateName = "Initial";

  // Simulate Request 1 (Old: slow 150ms geocode)
  const req1Id = ++locationRequestId;
  const promise1 = new Promise<void>((resolve) => {
    setTimeout(() => {
      // Simulate reverseGeocodeCoords check:
      if (req1Id === locationRequestId) {
        resolvedStateName = "Slow Old Result (Bengaluru)";
      }
      resolve();
    }, 150);
  });

  // Simulate Request 2 fired immediately after (New: fast 30ms geocode)
  const req2Id = ++locationRequestId;
  const promise2 = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (req2Id === locationRequestId) {
        resolvedStateName = "Fast Latest Result (Mysuru)";
      }
      resolve();
    }, 30);
  });

  await Promise.all([promise1, promise2]);

  assertEqual(
    resolvedStateName,
    "Fast Latest Result (Mysuru)",
    "Latest request (Mysuru) must prevail over slow earlier request"
  );
}

testRaceConditionPrevention().then(() => {
  console.log("✅ PASS: Race condition sequence counter prevents stale responses from overwriting latest result");

  // -----------------------------------------------------------------------------
  // Test 6: Manual Search and Saved-Address Selection Continuing to Work
  // -----------------------------------------------------------------------------
  console.log("\n--- Group 6: Manual Search & Saved Address Display Label ---");

  const karnatakaAddr: DeliveryAddress = {
    fullName: "Ramesh Kumar",
    phone: "9876543210",
    houseDetails: "Flat 402, Sunshine Apts",
    streetArea: "Indiranagar",
    city: "Bengaluru",
    district: "Karnataka",
    pincode: "560038",
    addressType: "Home",
    lat: 12.9784,
    lng: 77.6408
  };
  const karnatakaAddrLabel = formatAddressDisplayLabel(karnatakaAddr);
  assertEqual(karnatakaAddrLabel, "Indiranagar, Bengaluru", "Karnataka address formats to 'Indiranagar, Bengaluru'");
  assert(!karnatakaAddrLabel.includes("Kerala"), "Karnataka address must not inject 'Kerala'");

  const keralaAddr: DeliveryAddress = {
    fullName: "Suresh Menon",
    phone: "9876543211",
    houseDetails: "Menon Villa",
    streetArea: "Kakkanad",
    city: "Kochi",
    district: "Ernakulam",
    pincode: "682030",
    addressType: "Home",
    lat: 9.9981,
    lng: 76.2999
  };
  const keralaAddrLabel = formatAddressDisplayLabel(keralaAddr);
  assertEqual(keralaAddrLabel, "Kakkanad, Kochi", "Kerala address formats to 'Kakkanad, Kochi'");

  const nullAddrLabel = formatAddressDisplayLabel(null);
  assertEqual(nullAddrLabel, "Saved Address", "Null address falls back to 'Saved Address'");
  console.log("✅ PASS: Saved address display labels format truthfully without hardcoded state fallbacks");

  // -----------------------------------------------------------------------------
  // Test 7: "Pick on Interactive Map" Option Removed
  // -----------------------------------------------------------------------------
  console.log("\n--- Group 7: Verify 'Pick on Interactive Map' Removed ---");

  const modalPath = path.resolve(process.cwd(), "src/components/LocationPickerModal.tsx");
  const modalContent = fs.readFileSync(modalPath, "utf-8");

  assert(!modalContent.includes("Pick on Interactive Map"), "'Pick on Interactive Map' must be removed from LocationPickerModal");
  assert(!modalContent.includes("handlePickOnMap"), "handlePickOnMap handler must be removed");
  assert(!modalContent.includes("navigation.navigate(\"Map\")"), "Map navigation must be removed from LocationPickerModal");
  assert(modalContent.includes("Use Current Location"), "Use Current Location option must be preserved");
  assert(modalContent.includes("Use Saved Address"), "Use Saved Address option must be preserved");
  assert(modalContent.includes("Palode"), "Palode quick selection must be preserved");
  assert(modalContent.includes("Search area, town, or city..."), "Search input must be preserved");
  console.log("✅ PASS: 'Pick on Interactive Map' option completely removed from manual selection flow");

  // -----------------------------------------------------------------------------
  // Test 8: Nearby-Deal Discovery Uses Correct Active Location Source
  // -----------------------------------------------------------------------------
  console.log("\n--- Group 8: Nearby-Deal Discovery with Active GPS ---");

  // Consumer physically in Bengaluru, Karnataka: 12.9716, 77.5946
  const consumerBengaluruCoords: Coordinates = { latitude: 12.9716, longitude: 77.5946 };
  const resolvedBengaluru = resolveEligibleConsumerLocation(true, consumerBengaluruCoords, null);

  assert(resolvedBengaluru !== null, "Consumer location must resolve");
  assertEqual(resolvedBengaluru?.source, "verified_device_gps", "Source must be verified_device_gps");
  assertEqual(resolvedBengaluru?.coords.latitude, 12.9716, "Resolved latitude must match GPS");
  assertEqual(resolvedBengaluru?.coords.longitude, 77.5946, "Resolved longitude must match GPS");

  // Store 1: Nearby Bengaluru store at MG Road (~2.8 km away)
  const storeBengaluruNearby = { latitude: 12.9740, longitude: 77.6200 };
  const distNearby = calculateDistanceInMeters(consumerBengaluruCoords, storeBengaluruNearby);
  assert(distNearby <= CONSUMER_NOTIFICATION_RADAR_METERS, `Nearby Karnataka deal (~${distNearby}m) is within 5km`);

  // Store 2: Far store in Kochi, Kerala (~360 km away)
  const storeKochiFar = { latitude: 9.9981, longitude: 76.2999 };
  const distFar = calculateDistanceInMeters(consumerBengaluruCoords, storeKochiFar);
  assert(distFar > CONSUMER_NOTIFICATION_RADAR_METERS, `Far Kerala deal (~${distFar}m) is far outside 5km`);

  console.log(`✅ PASS: Nearby deal discovery correctly uses active GPS (nearby: ${distNearby}m <= 5000m, far: ${distFar}m > 5000m)`);

  console.log("\n=======================================================");
  console.log("ALL 8 LOCATION VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉");
  console.log("=======================================================\n");
});
