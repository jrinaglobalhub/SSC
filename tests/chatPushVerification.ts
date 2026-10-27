/**
 * Chat Push Notification Verification Test Suite
 * Tests bidirectional routing (Customer -> SSM, Merchant -> SSC),
 * sender suppression, idempotency, payload size trimming, and token deactivation.
 */

function truncateText(text: string, maxLength = 80): string {
  if (!text) return "New message";
  const clean = text.replace(/[\r\n]+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength - 3) + "...";
}

interface ChatMessage {
  id: string;
  thread_id: string;
  store_id: string;
  store_name?: string;
  customer_id?: string;
  sender_id: string;
  sender: "customer" | "user" | "merchant" | "store" | "system";
  customer_name?: string;
  text: string;
}

interface UserPushToken {
  device_id: string;
  user_id: string;
  push_token: string;
  app_name: "ssc" | "ssm";
  is_active: boolean;
}

interface ResolutionResult {
  shouldSend: boolean;
  reason?: string;
  targetApp?: "ssc" | "ssm";
  recipientUserId?: string;
  title?: string;
  body?: string;
  channelId?: string;
  eligibleDeviceIds?: string[];
}

function resolveChatPush(
  msg: ChatMessage,
  storeOwnerMap: Record<string, string>, // store_id -> owner_id
  allTokens: UserPushToken[],
  alreadyNotifiedDeviceIds: Set<string>
): ResolutionResult {
  if (msg.sender === "system") {
    return { shouldSend: false, reason: "ignored_system_message" };
  }

  let recipientUserId: string | null = null;
  let targetApp: "ssc" | "ssm" = "ssm";
  let channelId = "merchant_orders_and_chats";
  let title = "💬 New Message";

  if (msg.sender === "customer" || msg.sender === "user") {
    targetApp = "ssm";
    channelId = "merchant_orders_and_chats";
    recipientUserId = storeOwnerMap[msg.store_id] || null;
    if (!recipientUserId) {
      return { shouldSend: false, reason: "store_owner_not_found" };
    }
    title = `💬 Message from ${msg.customer_name || "Customer"}`;
  } else if (msg.sender === "merchant" || msg.sender === "store") {
    targetApp = "ssc";
    channelId = "deals_and_messages";
    recipientUserId = msg.customer_id || null;
    if (!recipientUserId) {
      return { shouldSend: false, reason: "no_customer_id" };
    }
    title = `💬 ${msg.store_name || "Store"} replied`;
  } else {
    return { shouldSend: false, reason: "unknown_sender" };
  }

  const body = truncateText(msg.text, 80);

  // Filter tokens: active, matching app and recipient, NOT the sender, NOT already notified
  const eligible = allTokens.filter((t) => {
    if (!t.is_active) return false;
    if (t.app_name !== targetApp) return false;
    if (t.user_id !== recipientUserId) return false;
    if (t.user_id === msg.sender_id) return false; // Never notify sender of own message
    if (alreadyNotifiedDeviceIds.has(t.device_id)) return false; // Idempotent
    return true;
  });

  if (eligible.length === 0) {
    return { shouldSend: false, reason: "no_eligible_tokens", targetApp, recipientUserId };
  }

  return {
    shouldSend: true,
    targetApp,
    recipientUserId,
    title,
    body,
    channelId,
    eligibleDeviceIds: eligible.map((e) => e.device_id),
  };
}

// -------------------------------------------------------------
// Test Execution
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

console.log("=== RUNNING CHAT PUSH VERIFICATION TESTS ===\n");

const storeOwners: Record<string, string> = {
  store_123: "user_merchant_456",
  store_abc: "user_merchant_789",
};

const registeredTokens: UserPushToken[] = [
  // Merchant devices (SSM)
  { device_id: "dev_merch_1", user_id: "user_merchant_456", push_token: "ExponentPushToken[m1]", app_name: "ssm", is_active: true },
  { device_id: "dev_merch_2", user_id: "user_merchant_456", push_token: "ExponentPushToken[m2]", app_name: "ssm", is_active: true },
  // Customer devices (SSC)
  { device_id: "dev_cust_1", user_id: "user_customer_999", push_token: "ExponentPushToken[c1]", app_name: "ssc", is_active: true },
  { device_id: "dev_cust_inactive", user_id: "user_customer_999", push_token: "ExponentPushToken[c_old]", app_name: "ssc", is_active: false },
];

// Test 1: Customer inquiry routes to Merchant SSM devices
console.log("--- Group 1: Customer to Merchant Routing ---");
const customerMsg: ChatMessage = {
  id: "msg_001",
  thread_id: "th_1",
  store_id: "store_123",
  customer_id: "user_customer_999",
  sender_id: "user_customer_999",
  sender: "customer",
  customer_name: "Rahul Sharma",
  text: "Is the discount on organic apples still available today?",
};

const res1 = resolveChatPush(customerMsg, storeOwners, registeredTokens, new Set());
assert(res1.shouldSend, "Customer message is approved for push delivery");
assert(res1.targetApp === "ssm", "Target app is correctly identified as SSM (Merchant)");
assert(res1.recipientUserId === "user_merchant_456", "Recipient is correctly resolved to store owner");
assert(res1.channelId === "merchant_orders_and_chats", "Channel is correctly set to merchant_orders_and_chats");
assert(res1.eligibleDeviceIds?.length === 2, "Multiple registered merchant devices are both targeted (2 devices)");
assert(res1.title === "💬 Message from Rahul Sharma", "Title displays customer name");

// Test 2: Merchant reply routes to Customer SSC devices
console.log("\n--- Group 2: Merchant to Customer Routing ---");
const merchantReply: ChatMessage = {
  id: "msg_002",
  thread_id: "th_1",
  store_id: "store_123",
  store_name: "Fresh Valley Kochi",
  customer_id: "user_customer_999",
  sender_id: "user_merchant_456",
  sender: "merchant",
  text: "Yes, organic apples are fresh and the 20% discount is valid until 9 PM!",
};

const res2 = resolveChatPush(merchantReply, storeOwners, registeredTokens, new Set());
assert(res2.shouldSend, "Merchant reply is approved for push delivery");
assert(res2.targetApp === "ssc", "Target app is correctly identified as SSC (Consumer)");
assert(res2.recipientUserId === "user_customer_999", "Recipient is correctly resolved to customer UUID");
assert(res2.channelId === "deals_and_messages", "Channel is correctly set to deals_and_messages");
assert(res2.eligibleDeviceIds?.length === 1, "Only active customer device is targeted (inactive token excluded)");
assert(res2.title === "💬 Fresh Valley Kochi replied", "Title displays merchant store name");

// Test 3: Sender suppression rule
console.log("\n--- Group 3: Sender Suppression ---");
// If merchant's own device somehow had the customer user ID (same user), they should never receive a push for their own message
const selfTokens: UserPushToken[] = [
  { device_id: "dev_self", user_id: "user_customer_999", push_token: "ExponentPushToken[self]", app_name: "ssm", is_active: true }
];
const resSelf = resolveChatPush(customerMsg, { store_123: "user_customer_999" }, selfTokens, new Set());
assert(!resSelf.shouldSend, "Sender is strictly NOT notified of their own message");

// Test 4: System messages skipped
console.log("\n--- Group 4: System Message Filtering ---");
const systemMsg: ChatMessage = {
  id: "msg_sys",
  thread_id: "th_1",
  store_id: "store_123",
  sender_id: "system",
  sender: "system",
  text: "Chat thread opened.",
};
const resSys = resolveChatPush(systemMsg, storeOwners, registeredTokens, new Set());
assert(!resSys.shouldSend, "System generated messages are skipped from push notifications");

// Test 5: Server-side idempotency
console.log("\n--- Group 5: Server-Side Idempotency ---");
const alreadySent = new Set(["dev_merch_1"]);
const resIdempotent = resolveChatPush(customerMsg, storeOwners, registeredTokens, alreadySent);
assert(resIdempotent.shouldSend, "Eligible unsent devices still receive push");
assert(resIdempotent.eligibleDeviceIds?.length === 1, "Already notified device dev_merch_1 is excluded");
assert(resIdempotent.eligibleDeviceIds?.[0] === "dev_merch_2", "Only unnotified dev_merch_2 is included");

// Test 6: Text truncation for small safe payloads
console.log("\n--- Group 6: Text Truncation & Payload Safety ---");
const longText = "A".repeat(200);
const truncated = truncateText(longText, 80);
assert(truncated.length <= 80, "Long text is safely truncated within 80 characters");
assert(truncated.endsWith("..."), "Truncated text ends with ellipsis");

// Test 7: DeviceNotRegistered Token Deactivation
console.log("\n--- Group 7: DeviceNotRegistered Invalidation ---");
const mockTickets = [
  { status: "ok", id: "ticket_1" },
  { status: "error", message: "DeviceNotRegistered", details: { error: "DeviceNotRegistered" } },
];
const deactivated: string[] = [];
mockTickets.forEach((t, i) => {
  if (t.details?.error === "DeviceNotRegistered") {
    deactivated.push(`token_${i}`);
  }
});
assert(deactivated.length === 1, "Expired/unregistered device token flagged for deactivation");
assert(deactivated[0] === "token_1", "Correct token identified");

console.log(`\n========================================`);
console.log(`ALL CHAT PUSH VERIFICATION TESTS COMPLETED: ${passed}/${total} PASSED`);
console.log(`========================================\n`);
