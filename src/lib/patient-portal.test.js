import { beforeEach, describe, expect, mock, test } from "bun:test";

let user;
let patientRows;
let campaignRows;
const filters = [];
mock.module("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
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
const { hasOngoingCampaign } = await import("./patient-portal");

beforeEach(() => {
  user = { id: "current-account" };
  patientRows = [{ id: "owned-patient" }];
  campaignRows = [{ id: "ongoing-campaign" }];
  filters.length = 0;
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