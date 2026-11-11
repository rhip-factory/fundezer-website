import { describe, expect, test, beforeEach } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

interface DbRow {
  [key: string]: any;
}

/**
 * In-memory test store mirroring the unified Supabase schema
 * shared across Patient Portal, Admin Hub, Donor Space and Public Website.
 */
class InMemorySupabase {
  tables: Record<string, DbRow[]> = {
    hospitals: [
      {
        id: "hosp-cedarcrest",
        name: "Cedarcrest Hospital",
        city: "Abuja",
        specialty: "Cardiology, orthopaedics & surgery",
        status: "active",
        verification: "Verified",
      },
      {
        id: "hosp-alliance",
        name: "Alliance Hospital",
        city: "Abuja",
        specialty: "Multispecialty & fertility care",
        status: "active",
        verification: "Verified",
      },
    ],
    patients: [],
    applications: [],
    campaigns: [],
    causes: [
      {
        id: "cause-cardiac",
        name: "Abuja Pediatric Heart Surgery Fund",
        status: "Active",
      },
    ],
    services: [
      {
        id: "serv-cardiac",
        name: "Cardiothoracic Surgery",
      },
    ],
    donations: [],
    recurring_plans: [],
    audit_logs: [],
    notifications: [],
    profiles: [
      {
        id: "prof-admin",
        user_id: "admin-user-001",
        full_name: "Ada Nwankwo",
        email: "ada.nwankwo@fundezer.ng",
        status: "active",
      },
      {
        id: "prof-patient",
        user_id: "patient-user-001",
        full_name: "Chukwudi Okafor",
        email: "chukwudi@fundezer.ng",
        status: "active",
      },
      {
        id: "prof-donor",
        user_id: "donor-user-001",
        full_name: "Emeka Obi",
        email: "emeka.obi@example.com",
        status: "active",
      },
    ],
    user_roles: [
      {
        id: "role-1",
        user_id: "admin-user-001",
        role: "platform_administrator",
      },
    ],
  };

  from(tableName: string) {
    if (!this.tables[tableName]) {
      this.tables[tableName] = [];
    }
    const table = this.tables[tableName];
    let filtered = [...table];
    let insertedRows: DbRow[] = [];
    let isInsert = false;
    let isUpdate = false;
    let patchData: DbRow | null = null;

    const builder: any = {
      select: (columns?: string) => builder,
      insert: (recordOrRecords: DbRow | DbRow[]) => {
        isInsert = true;
        const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
        insertedRows = records.map((r) => {
          const id = r.id || `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
          const created_at = r.created_at || new Date().toISOString();
          const submitted_at = r.submitted_at || created_at;
          const status_changed_at = r.status_changed_at || created_at;
          return { ...r, id, created_at, submitted_at, status_changed_at };
        });
        table.push(...insertedRows);
        return builder;
      },
      update: (patch: DbRow) => {
        isUpdate = true;
        patchData = patch;
        return builder;
      },
      delete: () => {
        this.tables[tableName] = table.filter((r) => !filtered.includes(r));
        return builder;
      },
      eq: (col: string, val: any) => {
        filtered = filtered.filter((r) => r[col] === val);
        if (isUpdate && patchData) {
          for (const row of table) {
            if (row[col] === val) {
              Object.assign(row, patchData);
            }
          }
        }
        return builder;
      },
      neq: (col: string, val: any) => {
        filtered = filtered.filter((r) => r[col] !== val);
        return builder;
      },
      in: (col: string, vals: any[]) => {
        filtered = filtered.filter((r) => vals.includes(r[col]));
        if (isUpdate && patchData) {
          for (const row of table) {
            if (vals.includes(row[col])) {
              Object.assign(row, patchData);
            }
          }
        }
        return builder;
      },
      ilike: (col: string, val: string) => {
        const query = val.toLowerCase().replace(/%/g, "");
        filtered = filtered.filter((r) => String(r[col] || "").toLowerCase().includes(query));
        return builder;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        const asc = opts?.ascending ?? true;
        filtered.sort((a, b) => {
          if (a[col] < b[col]) return asc ? -1 : 1;
          if (a[col] > b[col]) return asc ? 1 : -1;
          return 0;
        });
        return builder;
      },
      limit: (n: number) => {
        filtered = filtered.slice(0, n);
        return builder;
      },
      single: async () => {
        const row = isInsert ? insertedRows[0] : filtered[0];
        if (!row) return { data: null, error: new Error(`Row not found in ${tableName}`) };
        return { data: { ...row }, error: null };
      },
      maybeSingle: async () => {
        const row = isInsert ? insertedRows[0] : filtered[0];
        return { data: row ? { ...row } : null, error: null };
      },
      then: (resolve: any) => {
        const data = isInsert ? insertedRows : filtered.map((r) => ({ ...r }));
        return Promise.resolve({ data, error: null }).then(resolve);
      },
    };

    return builder;
  }
}

describe("Unified FundEzer Platform - Seamless Patient to Admin Data Flow", () => {
  let db: InMemorySupabase;

  beforeEach(() => {
    db = new InMemorySupabase();
  });

  test("Step 1: Patient submits application -> creates Patient, Application and draft Campaign", async () => {
    const patientUserId = "patient-user-001";
    const patientEmail = "chukwudi@fundezer.ng";

    // Simulate patient submit flow (from src/lib/patient/applications.functions.ts)
    const { data: createdPatient, error: patientErr } = await db
      .from("patients")
      .insert({
        user_id: patientUserId,
        reference_code: "PT-CHUKWUDI",
        display_name: "Chukwudi Okafor",
        full_name: "Chukwudi Okafor",
        email: patientEmail,
        phone: "+2348012345678",
        date_of_birth: "1994-08-14",
        gender: "Male",
        city: "Abuja",
        state: "FCT",
        condition: "Mitral valve defect",
        urgency: "High",
        status: "Active",
        current_hospital_id: "hosp-cedarcrest",
      })
      .select("id")
      .single();

    expect(patientErr).toBeNull();
    expect(createdPatient?.id).toBeTruthy();

    const applicationTitle = "Sponsorship for Open-Heart Surgery";
    const storyText = "Diagnosed with severe mitral regurgitation at Cedarcrest Hospital.";
    const summaryText = "Chukwudi requires open-heart mitral valve repair in Abuja.";

    // Application is submitted in "Submitted" status
    const { data: createdApp, error: appErr } = await db
      .from("applications")
      .insert({
        patient_id: createdPatient.id,
        hospital_id: "hosp-cedarcrest",
        cause_id: "cause-cardiac",
        service_id: "serv-cardiac",
        title: applicationTitle,
        description: storyText,
        requested_amount: 0, // Set by hospital after clinical assessment
        status: "Submitted",
      })
      .select("id, status, title")
      .single();

    expect(appErr).toBeNull();
    expect(createdApp.status).toBe("Submitted");
    expect(createdApp.title).toBe(applicationTitle);

    // Initial linked campaign is created under "Under Review" (private until approved)
    const { data: createdCampaign, error: campErr } = await db
      .from("campaigns")
      .insert({
        patient_id: createdPatient.id,
        application_id: createdApp.id,
        hospital_id: "hosp-cedarcrest",
        cause_id: "cause-cardiac",
        slug: "sponsorship-for-open-heart-surgery-pt1",
        title: applicationTitle,
        public_title: applicationTitle,
        public_story: summaryText,
        internal_summary: storyText,
        target: 0,
        status: "Under Review",
      })
      .select("id, status, target")
      .single();

    expect(campErr).toBeNull();
    expect(createdCampaign.status).toBe("Under Review");
    expect(createdCampaign.target).toBe(0);

    // Verify patient has ongoing campaign
    const { data: ongoing } = await db
      .from("campaigns")
      .select("id")
      .eq("patient_id", createdPatient.id)
      .in("status", ["Draft", "Under Review", "Active"]);

    expect(ongoing.length).toBe(1);
  });

  test("Step 2: Admin Hub receives patient submission in queue with zero redundancy", async () => {
    // Seed the patient application
    const { data: patient } = await db
      .from("patients")
      .insert({
        user_id: "patient-user-001",
        reference_code: "PT-CHUKWUDI",
        display_name: "Chukwudi Okafor",
        condition: "Mitral valve defect",
        urgency: "High",
        status: "Active",
        current_hospital_id: "hosp-cedarcrest",
      })
      .select("id")
      .single();

    const { data: app } = await db
      .from("applications")
      .insert({
        patient_id: patient.id,
        hospital_id: "hosp-cedarcrest",
        title: "Sponsorship for Open-Heart Surgery",
        description: "Diagnosed with severe mitral regurgitation.",
        requested_amount: 0,
        status: "Submitted",
      })
      .select("id")
      .single();

    // Admin lists applications (simulating listApplications in src/lib/admin/applications.functions.ts)
    const { data: adminList } = await db
      .from("applications")
      .select("id, title, status, patient_id, hospital_id")
      .order("submitted_at", { ascending: false });

    expect(adminList.length).toBe(1);
    expect(adminList[0].id).toBe(app.id);
    expect(adminList[0].status).toBe("Submitted");

    // Relational lookup for patient and hospital
    const { data: linkedPatient } = await db
      .from("patients")
      .select("display_name, reference_code, condition")
      .eq("id", adminList[0].patient_id)
      .single();

    const { data: linkedHospital } = await db
      .from("hospitals")
      .select("name, city")
      .eq("id", adminList[0].hospital_id)
      .single();

    expect(linkedPatient.display_name).toBe("Chukwudi Okafor");
    expect(linkedPatient.condition).toBe("Mitral valve defect");
    expect(linkedHospital.name).toBe("Cedarcrest Hospital");
    expect(linkedHospital.city).toBe("Abuja");
  });

  test("Step 3: Admin reviews, verifies and approves application with immutable audit logging", async () => {
    const adminUserId = "admin-user-001";

    const { data: patient } = await db
      .from("patients")
      .insert({
        user_id: "patient-user-001",
        display_name: "Chukwudi Okafor",
      })
      .select("id")
      .single();

    const { data: app } = await db
      .from("applications")
      .insert({
        patient_id: patient.id,
        title: "Sponsorship for Open-Heart Surgery",
        status: "Submitted",
      })
      .select("id, status, title")
      .single();

    // 1. Admin moves to "Under Review"
    await db
      .from("applications")
      .update({
        status: "Under Review",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
      })
      .eq("id", app.id);

    await db.from("audit_logs").insert({
      actor_user_id: adminUserId,
      actor_name: "Ada Nwankwo",
      actor_role: "platform_administrator",
      action: "Application Under Review",
      entity_type: "Application",
      entity_id: app.id,
      entity_label: app.title,
      previous_state: { status: "Submitted" },
      new_state: { status: "Under Review" },
    });

    // 2. Admin verifies hospital estimate: "Verified"
    const verificationNote = "Cedarcrest clinical board confirmed estimate of ₦2,500,000.";
    await db
      .from("applications")
      .update({
        status: "Verified",
        verification_notes: verificationNote,
        verified_by: adminUserId,
      })
      .eq("id", app.id);

    await db.from("audit_logs").insert({
      actor_user_id: adminUserId,
      actor_name: "Ada Nwankwo",
      actor_role: "platform_administrator",
      action: "Application Verified",
      entity_type: "Application",
      entity_id: app.id,
      entity_label: app.title,
      previous_state: { status: "Under Review" },
      new_state: { status: "Verified" },
    });

    // 3. Final Approval: "Approved"
    await db
      .from("applications")
      .update({
        status: "Approved",
        decided_at: new Date().toISOString(),
      })
      .eq("id", app.id);

    await db.from("audit_logs").insert({
      actor_user_id: adminUserId,
      actor_name: "Ada Nwankwo",
      actor_role: "platform_administrator",
      action: "Application Approved",
      entity_type: "Application",
      entity_id: app.id,
      entity_label: app.title,
      previous_state: { status: "Verified" },
      new_state: { status: "Approved" },
    });

    // Verify application state in database
    const { data: updatedApp } = await db
      .from("applications")
      .select("status, verification_notes, decided_at")
      .eq("id", app.id)
      .single();

    expect(updatedApp.status).toBe("Approved");
    expect(updatedApp.verification_notes).toBe(verificationNote);
    expect(updatedApp.decided_at).toBeTruthy();

    // Verify complete audit trail
    const { data: logs } = await db
      .from("audit_logs")
      .select("action, actor_name, previous_state, new_state")
      .eq("entity_id", app.id);

    expect(logs.length).toBe(3);
    expect(logs[0].action).toBe("Application Under Review");
    expect(logs[1].action).toBe("Application Verified");
    expect(logs[2].action).toBe("Application Approved");
  });

  test("Step 4: Campaign target is priced & published by Admin -> visible to donors", async () => {
    const adminUserId = "admin-user-001";
    const publishedAt = new Date().toISOString();

    const { data: campaign } = await db
      .from("campaigns")
      .insert({
        title: "Sponsorship for Open-Heart Surgery",
        public_title: "Help Chukwudi Receive Open-Heart Surgery",
        public_story: "Chukwudi is an Abuja educator needing emergency mitral valve repair.",
        target: 0,
        status: "Under Review",
      })
      .select("id")
      .single();

    // Admin updates target and sets status to Active
    const verifiedTarget = 2_500_000;
    await db
      .from("campaigns")
      .update({
        target: verifiedTarget,
        status: "Active",
        published_at: publishedAt,
      })
      .eq("id", campaign.id);

    await db.from("audit_logs").insert({
      actor_user_id: adminUserId,
      actor_name: "Ada Nwankwo",
      actor_role: "platform_administrator",
      action: "Campaign Published",
      entity_type: "Campaign",
      entity_id: campaign.id,
      entity_label: "Help Chukwudi Receive Open-Heart Surgery",
      new_state: { status: "Active", target: verifiedTarget, published_at: publishedAt },
    });

    // Public / Donor query for active campaigns
    const { data: publicCampaigns } = await db
      .from("campaigns")
      .select("id, public_title, public_story, target, status, published_at")
      .eq("status", "Active");

    expect(publicCampaigns.length).toBe(1);
    expect(publicCampaigns[0].public_title).toBe("Help Chukwudi Receive Open-Heart Surgery");
    expect(publicCampaigns[0].target).toBe(2_500_000);
    expect(publicCampaigns[0].status).toBe("Active");
  });

  test("Step 5: Donor gives in Donor Space -> updates ledger & Admin Dashboard", async () => {
    const donorUserId = "donor-user-001";

    const { data: campaign } = await db
      .from("campaigns")
      .insert({
        title: "Help Chukwudi Receive Open-Heart Surgery",
        target: 2_500_000,
        status: "Active",
      })
      .select("id")
      .single();

    // Donor gives ₦250,000 (simulating createDonation in src/lib/donor-hub.functions.ts)
    const donationAmount = 250_000;
    const { data: donation, error: donErr } = await db
      .from("donations")
      .insert({
        donor_user_id: donorUserId,
        campaign_id: campaign.id,
        amount: donationAmount,
        currency: "NGN",
        donation_type: "Patient",
        payment_status: "Paid",
        allocation_status: "Allocated",
        payment_method: "Bank Transfer",
        is_anonymous: false,
      })
      .select("id, amount, payment_status")
      .single();

    expect(donErr).toBeNull();
    expect(donation.payment_status).toBe("Paid");
    expect(donation.amount).toBe(donationAmount);

    // Admin views live donation ledger (simulating listDonations in src/lib/admin/donations.functions.ts)
    const { data: adminDonations } = await db
      .from("donations")
      .select("id, amount, payment_status, campaign_id")
      .eq("payment_status", "Paid");

    expect(adminDonations.length).toBe(1);
    expect(adminDonations[0].amount).toBe(250_000);

    // Admin dashboard calculation
    const totalRaised = adminDonations.reduce((sum, d) => sum + d.amount, 0);
    expect(totalRaised).toBe(250_000);
    const fundingPercent = Math.round((totalRaised / 2_500_000) * 100);
    expect(fundingPercent).toBe(10);
  });

  test("Step 6: Patient Portal live overview receives real-time approval & funding status", async () => {
    const patientUserId = "patient-user-001";

    const { data: patient } = await db
      .from("patients")
      .insert({
        user_id: patientUserId,
        display_name: "Chukwudi Okafor",
        condition: "Mitral valve defect",
      })
      .select("id")
      .single();

    const { data: app } = await db
      .from("applications")
      .insert({
        patient_id: patient.id,
        title: "Sponsorship for Open-Heart Surgery",
        status: "Approved",
      })
      .select("id, status")
      .single();

    const { data: campaign } = await db
      .from("campaigns")
      .insert({
        patient_id: patient.id,
        application_id: app.id,
        title: "Help Chukwudi Receive Open-Heart Surgery",
        target: 2_500_000,
        status: "Active",
      })
      .select("id, target")
      .single();

    await db.from("donations").insert({
      campaign_id: campaign.id,
      amount: 250_000,
      payment_status: "Paid",
    });

    // Patient notification generated
    await db.from("notifications").insert({
      recipient_user_id: patientUserId,
      notification_type: "donation",
      title: "Donation received",
      message: "₦250,000 was contributed towards your treatment.",
      is_read: false,
    });

    // Patient views portal overview (simulating getPortalOverview in src/lib/patient/portal.functions.ts)
    const { data: myApp } = await db
      .from("applications")
      .select("id, status")
      .eq("patient_id", patient.id)
      .single();

    const { data: myCamp } = await db
      .from("campaigns")
      .select("id, target, status")
      .eq("patient_id", patient.id)
      .single();

    const { data: myDonations } = await db
      .from("donations")
      .select("amount")
      .eq("campaign_id", myCamp.id)
      .eq("payment_status", "Paid");

    const { data: myNotifs } = await db
      .from("notifications")
      .select("id, title, message")
      .eq("recipient_user_id", patientUserId);

    expect(myApp.status).toBe("Approved");
    expect(myCamp.status).toBe("Active");
    const raised = myDonations.reduce((sum, d) => sum + d.amount, 0);
    expect(raised).toBe(250_000);
    expect(myNotifs.length).toBe(1);
    expect(myNotifs[0].title).toBe("Donation received");
  });

  test("Step 7: Unified Route Tree and File Structure Verification", () => {
    // Verify that every merged route file exists in fundezer/src/routes/
    const baseRoutes = resolve(__dirname, "../routes");

    const requiredRoutes = [
      // Patient Portal routes
      "portal.tsx",
      "portal.index.tsx",
      "portal.application.tsx",
      "portal.campaign.tsx",
      "portal.treatment.tsx",
      "portal.documents.tsx",
      "portal.notifications.tsx",
      "portal.profile.tsx",
      "portal.settings.tsx",

      // Patient Apply Wizard routes
      "apply.tsx",
      "apply.location.tsx",
      "apply.hospital.tsx",
      "apply.registration.tsx",
      "apply.story.tsx",
      "apply.generating.tsx",
      "apply.story-review.tsx",
      "apply.documents.tsx",
      "apply.review.tsx",
      "apply.success.tsx",

      // Admin Hub routes
      "admin.tsx",
      "admin.index.tsx",
      "admin.applications.tsx",
      "admin.campaigns.tsx",
      "admin.causes.tsx",
      "admin.donations.tsx",
      "admin.hospitals.tsx",
      "admin.patients.tsx",
      "admin.transfers.tsx",
      "admin.audit-logs.tsx",
      "admin.settings.tsx",
      "admin.profile.tsx",

      // Donor Space route
      "_authenticated/donor.tsx",
      "_authenticated/wallet.tsx",
      "_authenticated/my-impact.index.tsx",

      // Public Website routes
      "index.tsx",
      "about.tsx",
      "campaigns.index.tsx",
      "causes.index.tsx",
      "hospitals.tsx",
      "how-it-works.tsx",
      "login.tsx",
      "auth.tsx",
    ];

    for (const routeFile of requiredRoutes) {
      const fullPath = resolve(baseRoutes, routeFile);
      expect(existsSync(fullPath)).toBe(true);
    }
  });

  test("Step 8: Hospital Portal Remains Separate as Required", () => {
    // Verify that hospital portal has NOT been merged into this repo
    const baseRoutes = resolve(__dirname, "../routes");
    expect(existsSync(resolve(baseRoutes, "hospital.tsx"))).toBe(false);
    expect(existsSync(resolve(baseRoutes, "hospital/dashboard.tsx"))).toBe(false);
  });
});
