import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

let user;
let patientRows;
let campaignRows;
let session;
const filters = [];
mock.module("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      getSession: async () => ({ data: { session }, error: null }),
    },
    from: (table) => ({
      select: () => ({
        eq: async (column, value) => {
          filters.push([table, column, value]);
          return { data: patientRows, error: null };
        },
        in: (column, value) => {
          filters.push([table, column, value]);
          return {
            in: (statusColumn, statuses) => {
              filters.push([table, statusColumn, statuses]);
              return { limit: async () => ({ data: campaignRows, error: null }) };
            },
          };
        },
      }),
    }),
  },
}));
const { hasOngoingCampaign, openPatientPortal, PATIENT_PORTAL_URL } = await import("./patient-portal");

const previousWindow = globalThis.window;
let assigned;

beforeEach(() => {
  user = { id: "current-account" };
  patientRows = [{ id: "owned-patient" }];
  campaignRows = [{ id: "ongoing-campaign" }];
  filters.length = 0;
  session = {
    access_token: "access-token-1",
    refresh_token: "refresh-token-1",
    expires_in: 3600,
    expires_at: 1760000000,
  };
  assigned = [];
  globalThis.window = {
    location: { assign: (url) => assigned.push(url) },
  };
});

afterEach(() => {
  globalThis.window = previousWindow;
});

describe("patient dashboard eligibility", () => {
  test("uses only the signed-in account's patient records", async () => {
    expect(await hasOngoingCampaign()).toBe(true);
    expect(filters).toContainEqual(["patients", "user_id", "current-account"]);
    expect(filters).toContainEqual(["campaigns", "patient_id", ["owned-patient"]]);
  });
  test("checks Draft, Under Review and Active ongoing campaigns", async () => {
    await hasOngoingCampaign();
    expect(filters).toContainEqual(["campaigns", "status", ["Draft", "Under Review", "Active"]]);
  });
  test("an account without a patient record is not sent to the patient dashboard", async () => {
    patientRows = [];
    expect(await hasOngoingCampaign()).toBe(false);
    expect(filters.some(([table]) => table === "campaigns")).toBe(false);
  });
  test("an account without an ongoing campaign is not sent to the patient dashboard", async () => {
    campaignRows = [];
    expect(await hasOngoingCampaign()).toBe(false);
  });
  test("signed-out visitors are not eligible", async () => {
    user = null;
    expect(await hasOngoingCampaign()).toBe(false);
    expect(filters).toHaveLength(0);
  });
});

describe("merged patient portal navigation", () => {
  test("navigates internally to /portal without external URL token leaks", async () => {
    expect(PATIENT_PORTAL_URL).toBe("/portal");
    expect(await openPatientPortal()).toBe(true);
    expect(assigned).toContain("/portal");
  });
});
