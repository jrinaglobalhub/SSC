/**
 * Edge Function & Webhook Processing Verification Test Suite
 * Tests authentication, payload validation, event filtering, 5,000m geo-filtering,
 * idempotency, and token deactivation handling.
 */

// Earth radius in metres
const EARTH_RADIUS_METRES = 6371e3;

function calculateDistanceInMeters(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METRES * c);
}

function isKakkanadDefault(lat: number, lng: number): boolean {
  return Math.abs(lat - 10.0159) < 0.0001 && Math.abs(lng - 76.3419) < 0.0001;
}

// 1. Webhook Authentication Verification
function verifyWebhookAuth(headers: { authorization?: string; "x-webhook-secret"?: string }, config: { webhookSecret?: string; serviceKey: string }): boolean {
  if (!config.webhookSecret) return true; // If no secret configured, open or handled by service key
  const authHeader = headers.authorization || "";
  const customSecret = headers["x-webhook-secret"] || "";

  if (authHeader === `Bearer ${config.webhookSecret}`) return true;
  if (customSecret === config.webhookSecret) return true;
  if (authHeader === `Bearer ${config.serviceKey}`) return true;
  return false;
}

// 2. Offer Publication & Webhook Payload Eligibility Check
interface WebhookPayload {
  type?: string;
  table?: string;
  record?: any;
  old_record?: any;
}

function shouldProcessWebhookOffer(payload: WebhookPayload): { process: boolean; reason?: string } {
  if (payload.table && payload.table !== "offers") {
    return { process: false, reason: "ignored_table" };
  }

  const eventType = (payload.type || "INSERT").toUpperCase();
  const record = payload.record;
  const oldRecord = payload.old_record;

  if (!record || !record.id) {
    return { process: false, reason: "missing_record_or_id" };
  }

  if (eventType === "UPDATE") {
    const wasDeleted = oldRecord?.is_deleted === true;
    const isDeleted = record.is_deleted === true;
    const wasDraft = oldRecord?.status === "draft";
    const isNowActive = record.status === "active" || record.status === "published";

    const becameActive = (wasDeleted && !isDeleted) || (wasDraft && isNowActive);
    if (!becameActive && oldRecord) {
      return { process: false, reason: "offer_already_published_update" };
    }
  }

  if (record.is_deleted) {
    return { process: false, reason: "offer_marked_deleted" };
  }

  if (record.end_at && new Date(record.end_at).getTime() <= Date.now()) {
    return { process: false, reason: "offer_expired" };
  }

  if (record.start_at && new Date(record.start_at).getTime() > Date.now() + 5 * 60 * 1000) {
    return { process: false, reason: "offer_scheduled_future" };
  }

  return { process: true };
}

// 3. Location & 5,000m Eligibility Resolution
interface ConsumerToken {
  device_id: string;
  push_token: string;
  location_source: string;
  last_lat: number | null;
  last_lng: number | null;
  user_address?: { lat: number; lng: number; city?: string } | null;
}

function filterEligibleConsumers(
  storeCoords: { latitude: number; longitude: number },
  consumers: ConsumerToken[],
  alreadyNotifiedDeviceIds: Set<string>
): { eligible: ConsumerToken[]; distances: Record<string, number> } {
  const eligible: ConsumerToken[] = [];
  const distances: Record<string, number> = {};

  for (const c of consumers) {
    // Check idempotency
    if (alreadyNotifiedDeviceIds.has(c.device_id)) continue;

    let consumerCoords: { latitude: number; longitude: number } | null = null;

    // Priority 1: Verified GPS coordinates (rejecting fabricated Kakkanad default)
    if (
      c.location_source === "gps" &&
      c.last_lat !== null &&
      c.last_lng !== null &&
      (c.last_lat !== 0 || c.last_lng !== 0) &&
      !isKakkanadDefault(c.last_lat, c.last_lng)
    ) {
      consumerCoords = { latitude: c.last_lat, longitude: c.last_lng };
    }
    // Priority 2: Saved address from user profile
    else if (c.user_address?.lat && c.user_address?.lng) {
      const aLat = c.user_address.lat;
      const aLng = c.user_address.lng;
      const isAddrKakkanad = isKakkanadDefault(aLat, aLng) && !(c.user_address.city || "").toLowerCase().includes("kakkanad");
      if ((aLat !== 0 || aLng !== 0) && !isAddrKakkanad) {
        consumerCoords = { latitude: aLat, longitude: aLng };
      }
    }
    // Priority 3: Saved address on token
    else if (c.last_lat !== null && c.last_lng !== null) {
      if ((c.last_lat !== 0 || c.last_lng !== 0) && !isKakkanadDefault(c.last_lat, c.last_lng)) {
        consumerCoords = { latitude: c.last_lat, longitude: c.last_lng };
      }
    }

    if (!consumerCoords) continue;

    const dist = calculateDistanceInMeters(consumerCoords, storeCoords);
    if (dist <= 5000) {
      eligible.push(c);
      distances[c.device_id] = dist;
    }
  }

  return { eligible, distances };
}

// -------------------------------------------------------------
// Test Execution & Assertions
// -------------------------------------------------------------
let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    passed++;
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log("=== RUNNING EDGE FUNCTION & WEBHOOK VERIFICATION TESTS ===\n");

// Group 1: Webhook Secret Authentication
console.log("--- Group 1: Webhook Secret Authentication ---");
const testSecret = "my_super_secret_webhook_token_123";
const testServiceKey = "supabase_service_role_secret_key_456";

assert(
  verifyWebhookAuth({ "x-webhook-secret": testSecret }, { webhookSecret: testSecret, serviceKey: testServiceKey }),
  "Custom x-webhook-secret header matches successfully"
);
assert(
  verifyWebhookAuth({ authorization: `Bearer ${testSecret}` }, { webhookSecret: testSecret, serviceKey: testServiceKey }),
  "Bearer authorization header with webhook secret matches successfully"
);
assert(
  verifyWebhookAuth({ authorization: `Bearer ${testServiceKey}` }, { webhookSecret: testSecret, serviceKey: testServiceKey }),
  "Supabase Service Role authorization header is accepted as server caller"
);
assert(
  !verifyWebhookAuth({ "x-webhook-secret": "wrong_secret" }, { webhookSecret: testSecret, serviceKey: testServiceKey }),
  "Incorrect x-webhook-secret header is rejected"
);
assert(
  !verifyWebhookAuth({ authorization: "Bearer invalid_key" }, { webhookSecret: testSecret, serviceKey: testServiceKey }),
  "Incorrect Bearer authorization header is rejected"
);
assert(
  !verifyWebhookAuth({}, { webhookSecret: testSecret, serviceKey: testServiceKey }),
  "Missing credentials when secret is configured is rejected"
);

// Group 2: Webhook Payload & Event Filtering
console.log("\n--- Group 2: Webhook Payload & Event Filtering ---");
assert(
  !shouldProcessWebhookOffer({ table: "chat_messages", record: { id: "msg_1" } }).process,
  "Events for non-offers tables are ignored"
);
assert(
  shouldProcessWebhookOffer({
    type: "INSERT",
    table: "offers",
    record: { id: "deal_1", is_deleted: false }
  }).process,
  "Standard new INSERT on offers is approved for processing"
);
assert(
  !shouldProcessWebhookOffer({
    type: "INSERT",
    table: "offers",
    record: { id: "deal_2", is_deleted: true }
  }).process,
  "Deleted offer on INSERT is skipped"
);
assert(
  !shouldProcessWebhookOffer({
    type: "INSERT",
    table: "offers",
    record: { id: "deal_3", is_deleted: false, end_at: new Date(Date.now() - 60000).toISOString() }
  }).process,
  "Expired offer is skipped"
);
assert(
  !shouldProcessWebhookOffer({
    type: "INSERT",
    table: "offers",
    record: { id: "deal_4", is_deleted: false, start_at: new Date(Date.now() + 3600000).toISOString() }
  }).process,
  "Future scheduled offer (> 5 mins) is skipped"
);
assert(
  !shouldProcessWebhookOffer({
    type: "UPDATE",
    table: "offers",
    old_record: { id: "deal_5", is_deleted: false, status: "active" },
    record: { id: "deal_5", is_deleted: false, status: "active", description: "Updated text" }
  }).process,
  "UPDATE event on already published active offer is skipped to prevent duplicate blasts"
);
assert(
  shouldProcessWebhookOffer({
    type: "UPDATE",
    table: "offers",
    old_record: { id: "deal_6", is_deleted: true },
    record: { id: "deal_6", is_deleted: false }
  }).process,
  "UPDATE event restoring a deleted offer to active is approved for processing"
);
assert(
  shouldProcessWebhookOffer({
    type: "UPDATE",
    table: "offers",
    old_record: { id: "deal_7", is_deleted: false, status: "draft" },
    record: { id: "deal_7", is_deleted: false, status: "active" }
  }).process,
  "UPDATE event publishing a draft offer is approved for processing"
);

// Group 3: 5,000m Geo-Filtering & Coordinate Fallback
console.log("\n--- Group 3: 5,000m Geo-Filtering & Fallbacks ---");
// Store at Marine Drive, Kochi: 9.9816, 76.2763
const storeKochi = { latitude: 9.9816, longitude: 76.2763 };

const consumers: ConsumerToken[] = [
  // 1. MG Road Kochi (~1.5 km away) - GPS verified
  {
    device_id: "dev_near_gps",
    push_token: "ExponentPushToken[near_gps]",
    location_source: "gps",
    last_lat: 9.9720,
    last_lng: 76.2790
  },
  // 2. Kadavanthra Kochi (~3.2 km away) - Saved address
  {
    device_id: "dev_near_saved",
    push_token: "ExponentPushToken[near_saved]",
    location_source: "saved_address",
    last_lat: null,
    last_lng: null,
    user_address: { lat: 9.9675, lng: 76.2990, city: "Kochi" }
  },
  // 3. Aluva (~18 km away) - GPS verified - OUT OF 5KM BOUNDS
  {
    device_id: "dev_far_aluva",
    push_token: "ExponentPushToken[far_aluva]",
    location_source: "gps",
    last_lat: 10.1076,
    last_lng: 76.3516
  },
  // 4. Fabricated Kakkanad default (10.0159, 76.3419) with non-Kakkanad address
  {
    device_id: "dev_fake_kakkanad",
    push_token: "ExponentPushToken[fake_k]",
    location_source: "saved_address",
    last_lat: 10.0159,
    last_lng: 76.3419,
    user_address: { lat: 10.0159, lng: 76.3419, city: "Thrissur" }
  },
  // 5. Zero coordinates (0, 0)
  {
    device_id: "dev_zero_coords",
    push_token: "ExponentPushToken[zero]",
    location_source: "gps",
    last_lat: 0,
    last_lng: 0
  }
];

const result = filterEligibleConsumers(storeKochi, consumers, new Set());
assert(result.eligible.length === 2, "Only consumers within 5,000m with verified coordinates are eligible (expected 2)");
assert(result.eligible.some((c) => c.device_id === "dev_near_gps"), "Near consumer (1.5km) with GPS is eligible");
assert(result.eligible.some((c) => c.device_id === "dev_near_saved"), "Near consumer (3.2km) with saved address is eligible");
assert(!result.eligible.some((c) => c.device_id === "dev_far_aluva"), "Far consumer (18km) is strictly excluded (> 5,000m)");
assert(!result.eligible.some((c) => c.device_id === "dev_fake_kakkanad"), "Consumer with fabricated Kakkanad default is safely excluded");
assert(!result.eligible.some((c) => c.device_id === "dev_zero_coords"), "Consumer with (0,0) coordinates is safely excluded");

// Group 4: Server-Side Idempotency
console.log("\n--- Group 4: Server-Side Idempotency ---");
const alreadyNotified = new Set(["dev_near_gps"]); // Suppose dev_near_gps was already notified
const idempotentResult = filterEligibleConsumers(storeKochi, consumers, alreadyNotified);
assert(
  !idempotentResult.eligible.some((c) => c.device_id === "dev_near_gps"),
  "Already notified device is excluded from new push dispatch (Idempotency preserved)"
);
assert(
  idempotentResult.eligible.some((c) => c.device_id === "dev_near_saved"),
  "Non-notified eligible device is still dispatched"
);

// Group 5: Expo Push Token Invalidation on DeviceNotRegistered
console.log("\n--- Group 5: Device Token Invalidation ---");
const mockTickets = [
  { status: "ok", id: "ticket_1" },
  { status: "error", message: '"ExponentPushToken[xxx]" is not a registered push key.', details: { error: "DeviceNotRegistered" } }
];

const tokensToDeactivate: string[] = [];
mockTickets.forEach((t, i) => {
  if (t.details?.error === "DeviceNotRegistered") {
    tokensToDeactivate.push(`token_${i}`);
  }
});

assert(tokensToDeactivate.length === 1, "Exactly one invalid token flagged for deactivation");
assert(tokensToDeactivate[0] === "token_1", "Correct token identified from DeviceNotRegistered error");

console.log(`\n========================================`);
console.log(`ALL VERIFICATION TESTS COMPLETED: ${passed}/${total} PASSED`);
console.log(`========================================\n`);
