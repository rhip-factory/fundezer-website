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
let opened;
let tabs;
let assigned;
let allowPopup;

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
  opened = [];
  tabs = [];
  assigned = [];
  allowPopup = true;
  globalThis.window = {
    open: (url, target) => {
      opened.push([url, target]);
      if (!allowPopup) return null;
      const tab = { opener: "linked-to-this-page" };
      tabs.push(tab);
      return tab;
    },
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

describe("patient portal handoff", () => {
  test("opens the portal in a new tab instead of this one", async () => {
    expect(await openPatientPortal()).toBe(true);
    expect(opened).toHaveLength(1);
    expect(opened[0][1]).toBe("_blank");
    expect(assigned).toHaveLength(0);
  });

  test("hands the session over in the URL fragment, never a query string", async () => {
    await openPatientPortal();
    const url = opened[0][0];
    expect(url.startsWith(`${PATIENT_PORTAL_URL}/portal#`)).toBe(true);
    const params = new URLSearchParams(url.slice(url.indexOf("#") + 1));
    expect(params.get("access_token")).toBe("access-token-1");
    expect(params.get("refresh_token")).toBe("refresh-token-1");
    expect(params.get("token_type")).toBe("bearer");
    expect(url).not.toContain("?access_token");
  });

  test("detaches the new tab so it cannot drive this page", async () => {
    await openPatientPortal();
    expect(tabs).toHaveLength(1);
    expect(tabs[0].opener).toBeNull();
  });

  test("uses this tab when the browser blocks the new one", async () => {
    allowPopup = false;
    expect(await openPatientPortal()).toBe(true);
    expect(opened).toHaveLength(1);
    expect(assigned).toHaveLength(1);
    expect(assigned[0].startsWith(`${PATIENT_PORTAL_URL}/portal#`)).toBe(true);
  });

  test("does nothing without a signed-in session", async () => {
    session = null;
    expect(await openPatientPortal()).toBe(false);
    expect(opened).toHaveLength(0);
    expect(assigned).toHaveLength(0);
  });
});
