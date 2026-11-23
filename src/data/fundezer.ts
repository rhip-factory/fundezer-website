// Centralized mock data layer for the FundEzer Admin Portal prototype.
// No backend: everything here is in-memory seed data.

export type CapabilityStatus = "Available" | "Temporarily Unavailable" | "Not Available";

export const SERVICES = [
  "CT Scan",
  "MRI",
  "Surgery",
  "Dialysis",
  "Radiotherapy",
  "Chemotherapy",
  "Physiotherapy",
  "ICU",
  "Cardiology",
  "Paediatrics",
] as const;

export type Service = (typeof SERVICES)[number];

export type HospitalStatus = "Active" | "Inactive";
export type VerificationStatus = "Verified" | "Pending" | "Suspended";

export interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  verification: VerificationStatus;
  status: HospitalStatus;
  contactRole: string;
  email: string;
  phone: string;
  beds: number;
  accreditation: string;
  onboarded: string;
  capabilities: Record<Service, CapabilityStatus>;
  equipment: { name: string; count: number; condition: string }[];
}

export type TreatmentStatus =
  | "Active"
  | "Treatment in Progress"
  | "Completed"
  | "Awaiting Treatment"
  | "Transferred";

export interface Patient {
  id: string;
  reference: string;
  displayName: string;
  ageBand: string;
  gender: "Male" | "Female";
  hospitalId: string;
  causeId: string;
  treatment: string;
  treatmentStage: string;
  status: TreatmentStatus;
  campaignId: string;
  lastUpdated: string;
  guardianRef: string;
  journey: { stage: string; date: string; done: boolean }[];
  updates: { date: string; author: string; note: string }[];
  hospitalHistory: { hospitalId: string; from: string; to: string | null; reason: string }[];
}

export type CampaignStatus = "Draft" | "Under Review" | "Active" | "Completed" | "Suspended";

export interface Campaign {
  id: string;
  title: string;
  patientId: string;
  hospitalId: string;
  causeId: string;
  target: number;
  raised: number;
  status: CampaignStatus;
  created: string;
  summary: string;
}

export type CauseStatus = "Active" | "Inactive";

export interface Cause {
  id: string;
  name: string;
  description: string;
  image: string;
  status: CauseStatus;
  fundingTarget: number;
  pool: number;
  totalDonations: number;
  patientsSupported: number;
  lastUpdated: string;
}

export type DonationType = "Patient Donation" | "Cause Donation" | "Recurring Donation";
export type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";
export type DonationStatus = "Allocated" | "Under Review" | "Held" | "Reversed";

export interface Donation {
  id: string;
  donor: string;
  type: DonationType;
  campaignId?: string;
  causeId?: string;
  amount: number;
  date: string;
  payment: PaymentStatus;
  status: DonationStatus;
  channel: string;
  recurringCadence?: string;
}

export type TransferStatus =
  | "Submitted"
  | "Under Review"
  | "Receiving Hospital Pending"
  | "Accepted"
  | "Patient Notified"
  | "Transfer Scheduled"
  | "Treatment Commenced"
  | "Completed"
  | "Rejected"
  | "Cancelled";

export type Urgency = "Routine" | "Urgent" | "Critical";

export interface Transfer {
  id: string;
  patientId: string;
  campaignId: string;
  fromHospitalId: string;
  requiredService: Service;
  recommendedHospitalId: string;
  receivingHospitalId?: string;
  urgency: Urgency;
  date: string;
  status: TransferStatus;
  reason: string;
  treatmentPhase: string;
  treatmentPlan: string;
  timeline: { status: string; at: string; by: string; note?: string | undefined }[];
}

export interface AuditEntry {
  id: string;
  at: string;
  user: string;
  role: string;
  action: string;
  recordType: string;
  record: string;
  description: string;
}

const cap = (
  available: Service[],
  temporary: Service[] = [],
): Record<Service, CapabilityStatus> => {
  const out = {} as Record<Service, CapabilityStatus>;
  SERVICES.forEach((s) => {
    out[s] = available.includes(s)
      ? "Available"
      : temporary.includes(s)
        ? "Temporarily Unavailable"
        : "Not Available";
  });
  return out;
};

export const hospitals: Hospital[] = [
  {
    id: "HSP-1001",
    name: "Lagos University Teaching Hospital",
    city: "Idi-Araba, Lagos",
    state: "Lagos",
    verification: "Verified",
    status: "Active",
    contactRole: "Head of Partnerships",
    email: "partnerships@luth.example.ng",
    phone: "+234 801 000 1001",
    beds: 760,
    accreditation: "FMoH Tertiary — Renewed Jan 2026",
    onboarded: "2024-03-12",
    capabilities: cap(
      ["CT Scan", "MRI", "Surgery", "Dialysis", "Chemotherapy", "ICU", "Cardiology", "Paediatrics"],
      ["Radiotherapy"],
    ),
    equipment: [
      { name: "128-slice CT Scanner", count: 2, condition: "Operational" },
      { name: "Dialysis Stations", count: 18, condition: "Operational" },
      { name: "Linear Accelerator", count: 1, condition: "Under maintenance" },
    ],
  },
  {
    id: "HSP-1002",
    name: "National Hospital Abuja",
    city: "Central Area, Abuja",
    state: "FCT",
    verification: "Verified",
    status: "Active",
    contactRole: "Director of Clinical Services",
    email: "clinical@nha.example.ng",
    phone: "+234 802 000 1002",
    beds: 420,
    accreditation: "FMoH Tertiary — Renewed Nov 2025",
    onboarded: "2024-05-02",
    capabilities: cap([
      "CT Scan",
      "MRI",
      "Surgery",
      "Radiotherapy",
      "Chemotherapy",
      "ICU",
      "Cardiology",
      "Physiotherapy",
    ]),
    equipment: [
      { name: "Linear Accelerator", count: 2, condition: "Operational" },
      { name: "3T MRI", count: 1, condition: "Operational" },
      { name: "ICU Ventilators", count: 24, condition: "Operational" },
    ],
  },
  {
    id: "HSP-1003",
    name: "University College Hospital Ibadan",
    city: "Ibadan",
    state: "Oyo",
    verification: "Verified",
    status: "Active",
    contactRole: "Chief Medical Director's Office",
    email: "cmd@uch.example.ng",
    phone: "+234 803 000 1003",
    beds: 850,
    accreditation: "FMoH Tertiary — Renewed Mar 2026",
    onboarded: "2024-01-18",
    capabilities: cap(
      ["CT Scan", "Surgery", "Dialysis", "Radiotherapy", "Chemotherapy", "ICU", "Paediatrics"],
      ["MRI"],
    ),
    equipment: [
      { name: "Radiotherapy Bunker", count: 1, condition: "Operational" },
      { name: "Paediatric ICU Beds", count: 12, condition: "Operational" },
    ],
  },
  {
    id: "HSP-1004",
    name: "Aminu Kano Teaching Hospital",
    city: "Kano",
    state: "Kano",
    verification: "Verified",
    status: "Active",
    contactRole: "Partnerships Desk",
    email: "partners@akth.example.ng",
    phone: "+234 804 000 1004",
    beds: 700,
    accreditation: "FMoH Tertiary — Renewed Aug 2025",
    onboarded: "2024-07-22",
    capabilities: cap(
      ["CT Scan", "Surgery", "Dialysis", "Chemotherapy", "ICU", "Paediatrics", "Physiotherapy"],
      ["Cardiology"],
    ),
    equipment: [
      { name: "Dialysis Stations", count: 22, condition: "Operational" },
      { name: "Mobile X-Ray", count: 4, condition: "Operational" },
    ],
  },
  {
    id: "HSP-1005",
    name: "University of Nigeria Teaching Hospital, Enugu",
    city: "Ituku-Ozalla, Enugu",
    state: "Enugu",
    verification: "Verified",
    status: "Active",
    contactRole: "Clinical Coordinator",
    email: "coordinator@unth.example.ng",
    phone: "+234 805 000 1005",
    beds: 500,
    accreditation: "FMoH Tertiary — Renewed Feb 2026",
    onboarded: "2024-09-09",
    capabilities: cap([
      "CT Scan",
      "MRI",
      "Surgery",
      "Dialysis",
      "Chemotherapy",
      "Cardiology",
      "Physiotherapy",
      "ICU",
    ]),
    equipment: [
      { name: "Cardiac Cath Lab", count: 1, condition: "Operational" },
      { name: "1.5T MRI", count: 1, condition: "Operational" },
    ],
  },
  {
    id: "HSP-1006",
    name: "Rivers State University Teaching Hospital",
    city: "Port Harcourt",
    state: "Rivers",
    verification: "Pending",
    status: "Active",
    contactRole: "Administrative Officer",
    email: "admin@rsuth.example.ng",
    phone: "+234 806 000 1006",
    beds: 375,
    accreditation: "Documents under review",
    onboarded: "2026-06-30",
    capabilities: cap(["CT Scan", "Surgery", "Dialysis", "ICU", "Paediatrics"], ["Chemotherapy"]),
    equipment: [{ name: "Dialysis Stations", count: 10, condition: "Operational" }],
  },
  {
    id: "HSP-1007",
    name: "Jos University Teaching Hospital",
    city: "Jos",
    state: "Plateau",
    verification: "Verified",
    status: "Inactive",
    contactRole: "Medical Records",
    email: "records@juth.example.ng",
    phone: "+234 807 000 1007",
    beds: 540,
    accreditation: "FMoH Tertiary — Renewal due Sep 2026",
    onboarded: "2025-02-14",
    capabilities: cap(["CT Scan", "Surgery", "Physiotherapy", "Paediatrics"], ["Dialysis"]),
    equipment: [{ name: "Theatre Suites", count: 6, condition: "Partially operational" }],
  },
  {
    id: "HSP-1008",
    name: "Grace Medical Centre, Benin",
    city: "Benin City",
    state: "Edo",
    verification: "Suspended",
    status: "Inactive",
    contactRole: "Facility Manager",
    email: "manager@gracemedical.example.ng",
    phone: "+234 808 000 1008",
    beds: 90,
    accreditation: "Suspended pending compliance review",
    onboarded: "2025-05-27",
    capabilities: cap(["Surgery", "Physiotherapy"]),
    equipment: [{ name: "General Theatre", count: 2, condition: "Operational" }],
  },
];

export const causes: Cause[] = [
  {
    id: "CAU-01",
    name: "Cancer Care",
    description:
      "Supports diagnostics, chemotherapy cycles and radiotherapy for patients in accredited oncology centres across Nigeria.",
    image: "oncology",
    status: "Active",
    fundingTarget: 250_000_000,
    pool: 164_820_000,
    totalDonations: 1_842,
    patientsSupported: 96,
    lastUpdated: "2026-08-14",
  },
  {
    id: "CAU-02",
    name: "Diabetes Care",
    description:
      "Covers insulin supply, glucose monitoring and diabetic wound care for low-income patients under hospital supervision.",
    image: "endocrine",
    status: "Active",
    fundingTarget: 90_000_000,
    pool: 41_300_000,
    totalDonations: 764,
    patientsSupported: 58,
    lastUpdated: "2026-08-11",
  },
  {
    id: "CAU-03",
    name: "Kidney Disease",
    description:
      "Funds dialysis sessions, transplant workup and post-transplant medication for patients with end-stage renal disease.",
    image: "renal",
    status: "Active",
    fundingTarget: 180_000_000,
    pool: 118_450_000,
    totalDonations: 1_203,
    patientsSupported: 71,
    lastUpdated: "2026-08-16",
  },
  {
    id: "CAU-04",
    name: "Maternal & Child Health",
    description:
      "Supports safe deliveries, emergency obstetric care and neonatal intensive care for mothers and newborns.",
    image: "maternal",
    status: "Active",
    fundingTarget: 120_000_000,
    pool: 73_910_000,
    totalDonations: 985,
    patientsSupported: 132,
    lastUpdated: "2026-08-09",
  },
  {
    id: "CAU-05",
    name: "Emergency Care",
    description:
      "Rapid-release funding for trauma, road traffic accidents and time-critical admissions within the first 48 hours.",
    image: "emergency",
    status: "Active",
    fundingTarget: 75_000_000,
    pool: 28_640_000,
    totalDonations: 612,
    patientsSupported: 88,
    lastUpdated: "2026-08-15",
  },
  {
    id: "CAU-06",
    name: "Surgery",
    description:
      "Covers scheduled and corrective surgical procedures, theatre consumables and post-operative recovery care.",
    image: "surgery",
    status: "Active",
    fundingTarget: 140_000_000,
    pool: 86_200_000,
    totalDonations: 1_057,
    patientsSupported: 64,
    lastUpdated: "2026-08-12",
  },
  {
    id: "CAU-07",
    name: "Cardiovascular Care",
    description:
      "Supports cardiac diagnostics, catheterisation, pacemaker implantation and long-term cardiac medication.",
    image: "cardiac",
    status: "Inactive",
    fundingTarget: 100_000_000,
    pool: 22_150_000,
    totalDonations: 318,
    patientsSupported: 19,
    lastUpdated: "2026-07-28",
  },
];

export const patients: Patient[] = [
  {
    id: "PT-2041",
    reference: "FZ-PT-2041",
    displayName: "Patient A. Okonkwo",
    ageBand: "34–39",
    gender: "Female",
    hospitalId: "HSP-1001",
    causeId: "CAU-01",
    treatment: "Breast cancer — chemotherapy cycles",
    treatmentStage: "Cycle 3 of 6",
    status: "Treatment in Progress",
    campaignId: "CMP-3101",
    lastUpdated: "2026-08-16",
    guardianRef: "Guardian ref. GR-8841",
    journey: [
      { stage: "Diagnosis confirmed", date: "2026-04-02", done: true },
      { stage: "Treatment plan approved", date: "2026-04-18", done: true },
      { stage: "Chemotherapy commenced", date: "2026-05-06", done: true },
      { stage: "Radiotherapy phase", date: "2026-09-01", done: false },
      { stage: "Review & discharge", date: "2026-11-20", done: false },
    ],
    updates: [
      { date: "2026-08-16", author: "LUTH Oncology", note: "Cycle 3 completed, tolerance good." },
      { date: "2026-07-29", author: "LUTH Oncology", note: "Bloodwork within acceptable range." },
    ],
    hospitalHistory: [
      { hospitalId: "HSP-1001", from: "2026-04-02", to: null, reason: "Primary oncology care" },
    ],
  },
  {
    id: "PT-2042",
    reference: "FZ-PT-2042",
    displayName: "Patient B. Adeyemi",
    ageBand: "8–12",
    gender: "Male",
    hospitalId: "HSP-1003",
    causeId: "CAU-03",
    treatment: "End-stage renal disease — dialysis",
    treatmentStage: "Maintenance dialysis",
    status: "Active",
    campaignId: "CMP-3102",
    lastUpdated: "2026-08-15",
    guardianRef: "Guardian ref. GR-8862",
    journey: [
      { stage: "Referral received", date: "2026-02-11", done: true },
      { stage: "Dialysis commenced", date: "2026-02-25", done: true },
      { stage: "Transplant workup", date: "2026-10-05", done: false },
    ],
    updates: [
      { date: "2026-08-15", author: "UCH Nephrology", note: "Twice-weekly dialysis maintained." },
    ],
    hospitalHistory: [
      { hospitalId: "HSP-1003", from: "2026-02-11", to: null, reason: "Nephrology unit" },
    ],
  },
  {
    id: "PT-2043",
    reference: "FZ-PT-2043",
    displayName: "Patient C. Musa",
    ageBand: "45–50",
    gender: "Male",
    hospitalId: "HSP-1004",
    causeId: "CAU-01",
    treatment: "Prostate cancer — radiotherapy required",
    treatmentStage: "Awaiting radiotherapy",
    status: "Awaiting Treatment",
    campaignId: "CMP-3103",
    lastUpdated: "2026-08-17",
    guardianRef: "Guardian ref. GR-8877",
    journey: [
      { stage: "Diagnosis confirmed", date: "2026-05-20", done: true },
      { stage: "Chemotherapy completed", date: "2026-07-30", done: true },
      { stage: "Radiotherapy transfer", date: "2026-08-17", done: false },
    ],
    updates: [
      {
        date: "2026-08-17",
        author: "AKTH Oncology",
        note: "Radiotherapy unavailable on-site; transfer requested.",
      },
    ],
    hospitalHistory: [
      { hospitalId: "HSP-1004", from: "2026-05-20", to: null, reason: "Oncology admission" },
    ],
  },
  {
    id: "PT-2044",
    reference: "FZ-PT-2044",
    displayName: "Patient D. Eze",
    ageBand: "28–33",
    gender: "Female",
    hospitalId: "HSP-1005",
    causeId: "CAU-04",
    treatment: "High-risk pregnancy — emergency obstetric care",
    treatmentStage: "Post-delivery recovery",
    status: "Completed",
    campaignId: "CMP-3104",
    lastUpdated: "2026-08-04",
    guardianRef: "Guardian ref. GR-8890",
    journey: [
      { stage: "Admission", date: "2026-06-14", done: true },
      { stage: "Emergency caesarean", date: "2026-06-19", done: true },
      { stage: "Discharged", date: "2026-07-02", done: true },
    ],
    updates: [
      { date: "2026-08-04", author: "UNTH Maternity", note: "Six-week review normal. Case closed." },
    ],
    hospitalHistory: [
      {
        hospitalId: "HSP-1005",
        from: "2026-06-14",
        to: "2026-07-02",
        reason: "Obstetric emergency",
      },
    ],
  },
  {
    id: "PT-2045",
    reference: "FZ-PT-2045",
    displayName: "Patient E. Bello",
    ageBand: "56–60",
    gender: "Male",
    hospitalId: "HSP-1002",
    causeId: "CAU-07",
    treatment: "Coronary artery disease — angioplasty",
    treatmentStage: "Pre-operative assessment",
    status: "Awaiting Treatment",
    campaignId: "CMP-3105",
    lastUpdated: "2026-08-13",
    guardianRef: "Guardian ref. GR-8902",
    journey: [
      { stage: "Cardiology review", date: "2026-07-08", done: true },
      { stage: "Angiography", date: "2026-08-02", done: true },
      { stage: "Angioplasty", date: "2026-09-10", done: false },
    ],
    updates: [
      { date: "2026-08-13", author: "NHA Cardiology", note: "Awaiting funding threshold to book." },
    ],
    hospitalHistory: [
      { hospitalId: "HSP-1002", from: "2026-07-08", to: null, reason: "Cardiology referral" },
    ],
  },
  {
    id: "PT-2046",
    reference: "FZ-PT-2046",
    displayName: "Patient F. Danjuma",
    ageBand: "2–5",
    gender: "Female",
    hospitalId: "HSP-1003",
    causeId: "CAU-06",
    treatment: "Congenital hernia repair",
    treatmentStage: "Surgery scheduled",
    status: "Treatment in Progress",
    campaignId: "CMP-3106",
    lastUpdated: "2026-08-12",
    guardianRef: "Guardian ref. GR-8915",
    journey: [
      { stage: "Paediatric review", date: "2026-07-21", done: true },
      { stage: "Surgery scheduled", date: "2026-08-26", done: false },
    ],
    updates: [
      { date: "2026-08-12", author: "UCH Paediatric Surgery", note: "Theatre slot confirmed." },
    ],
    hospitalHistory: [
      { hospitalId: "HSP-1003", from: "2026-07-21", to: null, reason: "Paediatric surgery" },
    ],
  },
  {
    id: "PT-2047",
    reference: "FZ-PT-2047",
    displayName: "Patient G. Nwachukwu",
    ageBand: "40–45",
    gender: "Female",
    hospitalId: "HSP-1002",
    causeId: "CAU-03",
    treatment: "Renal transplant workup",
    treatmentStage: "Donor matching",
    status: "Transferred",
    campaignId: "CMP-3107",
    lastUpdated: "2026-08-10",
    guardianRef: "Guardian ref. GR-8931",
    journey: [
      { stage: "Dialysis at UCH", date: "2026-03-04", done: true },
      { stage: "Transferred to NHA", date: "2026-07-15", done: true },
      { stage: "Transplant", date: "2026-10-01", done: false },
    ],
    updates: [
      { date: "2026-08-10", author: "NHA Nephrology", note: "Donor compatibility tests ongoing." },
    ],
    hospitalHistory: [
      { hospitalId: "HSP-1003", from: "2026-03-04", to: "2026-07-15", reason: "Dialysis" },
      { hospitalId: "HSP-1002", from: "2026-07-15", to: null, reason: "Transplant programme" },
    ],
  },
  {
    id: "PT-2048",
    reference: "FZ-PT-2048",
    displayName: "Patient H. Yakubu",
    ageBand: "18–23",
    gender: "Male",
    hospitalId: "HSP-1006",
    causeId: "CAU-05",
    treatment: "Road traffic trauma — orthopaedic repair",
    treatmentStage: "Stabilised, awaiting surgery",
    status: "Awaiting Treatment",
    campaignId: "CMP-3108",
    lastUpdated: "2026-08-17",
    guardianRef: "Guardian ref. GR-8944",
    journey: [
      { stage: "Emergency admission", date: "2026-08-09", done: true },
      { stage: "Stabilisation", date: "2026-08-11", done: true },
      { stage: "Orthopaedic surgery", date: "2026-08-24", done: false },
    ],
    updates: [
      { date: "2026-08-17", author: "RSUTH Trauma", note: "Awaiting theatre availability." },
    ],
    hospitalHistory: [
      { hospitalId: "HSP-1006", from: "2026-08-09", to: null, reason: "Trauma admission" },
    ],
  },
  {
    id: "PT-2049",
    reference: "FZ-PT-2049",
    displayName: "Patient J. Salami",
    ageBand: "60–65",
    gender: "Female",
    hospitalId: "HSP-1001",
    causeId: "CAU-02",
    treatment: "Diabetic foot ulcer management",
    treatmentStage: "Wound care programme",
    status: "Treatment in Progress",
    campaignId: "CMP-3109",
    lastUpdated: "2026-08-14",
    guardianRef: "Guardian ref. GR-8958",
    journey: [
      { stage: "Endocrine review", date: "2026-06-01", done: true },
      { stage: "Wound care commenced", date: "2026-06-12", done: true },
      { stage: "Review", date: "2026-09-05", done: false },
    ],
    updates: [{ date: "2026-08-14", author: "LUTH Endocrinology", note: "Ulcer grade improving." }],
    hospitalHistory: [
      { hospitalId: "HSP-1001", from: "2026-06-01", to: null, reason: "Endocrinology clinic" },
    ],
  },
  {
    id: "PT-2050",
    reference: "FZ-PT-2050",
    displayName: "Patient K. Ibrahim",
    ageBand: "13–17",
    gender: "Male",
    hospitalId: "HSP-1004",
    causeId: "CAU-01",
    treatment: "Osteosarcoma — chemotherapy",
    treatmentStage: "Cycle 1 of 4",
    status: "Active",
    campaignId: "CMP-3110",
    lastUpdated: "2026-08-16",
    guardianRef: "Guardian ref. GR-8963",
    journey: [
      { stage: "Biopsy confirmed", date: "2026-07-02", done: true },
      { stage: "Chemotherapy commenced", date: "2026-07-28", done: true },
      { stage: "Surgical review", date: "2026-10-14", done: false },
    ],
    updates: [{ date: "2026-08-16", author: "AKTH Oncology", note: "Cycle 1 completed." }],
    hospitalHistory: [
      { hospitalId: "HSP-1004", from: "2026-07-02", to: null, reason: "Oncology admission" },
    ],
  },
];

export const campaigns: Campaign[] = [
  {
    id: "CMP-3101",
    title: "Chemotherapy support for Patient A. Okonkwo",
    patientId: "PT-2041",
    hospitalId: "HSP-1001",
    causeId: "CAU-01",
    target: 4_800_000,
    raised: 3_420_000,
    status: "Active",
    created: "2026-04-20",
    summary: "Six chemotherapy cycles, imaging reviews and supportive medication at LUTH.",
  },
  {
    id: "CMP-3102",
    title: "Dialysis programme for Patient B. Adeyemi",
    patientId: "PT-2042",
    hospitalId: "HSP-1003",
    causeId: "CAU-03",
    target: 6_200_000,
    raised: 4_915_000,
    status: "Active",
    created: "2026-02-27",
    summary: "Twice-weekly dialysis sessions and transplant workup at UCH Ibadan.",
  },
  {
    id: "CMP-3103",
    title: "Radiotherapy access for Patient C. Musa",
    patientId: "PT-2043",
    hospitalId: "HSP-1004",
    causeId: "CAU-01",
    target: 5_500_000,
    raised: 4_180_000,
    status: "Active",
    created: "2026-05-25",
    summary: "Radiotherapy sessions requiring transfer to an equipped oncology centre.",
  },
  {
    id: "CMP-3104",
    title: "Emergency obstetric care for Patient D. Eze",
    patientId: "PT-2044",
    hospitalId: "HSP-1005",
    causeId: "CAU-04",
    target: 2_400_000,
    raised: 2_400_000,
    status: "Completed",
    created: "2026-06-15",
    summary: "Emergency caesarean, neonatal observation and post-natal recovery.",
  },
  {
    id: "CMP-3105",
    title: "Angioplasty for Patient E. Bello",
    patientId: "PT-2045",
    hospitalId: "HSP-1002",
    causeId: "CAU-07",
    target: 7_900_000,
    raised: 2_130_000,
    status: "Under Review",
    created: "2026-08-05",
    summary: "Coronary angioplasty with stent placement and cardiac rehabilitation.",
  },
  {
    id: "CMP-3106",
    title: "Paediatric hernia repair for Patient F. Danjuma",
    patientId: "PT-2046",
    hospitalId: "HSP-1003",
    causeId: "CAU-06",
    target: 1_350_000,
    raised: 1_120_000,
    status: "Active",
    created: "2026-07-23",
    summary: "Day-case paediatric surgery, theatre consumables and recovery.",
  },
  {
    id: "CMP-3107",
    title: "Transplant workup for Patient G. Nwachukwu",
    patientId: "PT-2047",
    hospitalId: "HSP-1002",
    causeId: "CAU-03",
    target: 12_000_000,
    raised: 6_740_000,
    status: "Active",
    created: "2026-03-10",
    summary: "Donor matching, transplant surgery and first-year immunosuppressants.",
  },
  {
    id: "CMP-3108",
    title: "Trauma surgery for Patient H. Yakubu",
    patientId: "PT-2048",
    hospitalId: "HSP-1006",
    causeId: "CAU-05",
    target: 3_100_000,
    raised: 940_000,
    status: "Under Review",
    created: "2026-08-10",
    summary: "Orthopaedic fixation following a road traffic accident in Port Harcourt.",
  },
  {
    id: "CMP-3109",
    title: "Diabetic wound care for Patient J. Salami",
    patientId: "PT-2049",
    hospitalId: "HSP-1001",
    causeId: "CAU-02",
    target: 1_800_000,
    raised: 1_260_000,
    status: "Active",
    created: "2026-06-13",
    summary: "Twelve-week wound care programme, dressings and glucose monitoring.",
  },
  {
    id: "CMP-3110",
    title: "Osteosarcoma treatment for Patient K. Ibrahim",
    patientId: "PT-2050",
    hospitalId: "HSP-1004",
    causeId: "CAU-01",
    target: 8_600_000,
    raised: 2_980_000,
    status: "Active",
    created: "2026-07-04",
    summary: "Four chemotherapy cycles with surgical review at AKTH.",
  },
  {
    id: "CMP-3111",
    title: "Physiotherapy support programme (draft)",
    patientId: "PT-2048",
    hospitalId: "HSP-1006",
    causeId: "CAU-05",
    target: 900_000,
    raised: 0,
    status: "Draft",
    created: "2026-08-16",
    summary: "Post-surgical rehabilitation plan pending hospital confirmation.",
  },
  {
    id: "CMP-3112",
    title: "Cardiac screening drive — Enugu",
    patientId: "PT-2045",
    hospitalId: "HSP-1005",
    causeId: "CAU-07",
    target: 2_000_000,
    raised: 380_000,
    status: "Suspended",
    created: "2026-05-18",
    summary: "Suspended pending updated documentation from the partner facility.",
  },
];

export const donations: Donation[] = [
  {
    id: "DON-90411",
    donor: "Chinelo Obi",
    type: "Patient Donation",
    campaignId: "CMP-3101",
    amount: 250_000,
    date: "2026-08-17T09:12:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Card",
  },
  {
    id: "DON-90412",
    donor: "Adewale Ogunlesi",
    type: "Cause Donation",
    causeId: "CAU-01",
    amount: 1_500_000,
    date: "2026-08-17T08:41:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Bank transfer",
  },
  {
    id: "DON-90413",
    donor: "Halima Sanusi",
    type: "Recurring Donation",
    causeId: "CAU-03",
    amount: 50_000,
    date: "2026-08-16T20:05:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Card",
    recurringCadence: "Monthly",
  },
  {
    id: "DON-90414",
    donor: "Emeka Nwosu",
    type: "Patient Donation",
    campaignId: "CMP-3102",
    amount: 400_000,
    date: "2026-08-16T15:33:00",
    payment: "Paid",
    status: "Allocated",
    channel: "USSD",
  },
  {
    id: "DON-90415",
    donor: "Zainab Lawal",
    type: "Cause Donation",
    causeId: "CAU-04",
    amount: 120_000,
    date: "2026-08-16T11:27:00",
    payment: "Pending",
    status: "Under Review",
    channel: "Bank transfer",
  },
  {
    id: "DON-90416",
    donor: "Ifeanyi Chukwu",
    type: "Patient Donation",
    campaignId: "CMP-3107",
    amount: 900_000,
    date: "2026-08-15T18:02:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Card",
  },
  {
    id: "DON-90417",
    donor: "Anonymous Donor",
    type: "Cause Donation",
    causeId: "CAU-05",
    amount: 2_000_000,
    date: "2026-08-15T10:14:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Bank transfer",
  },
  {
    id: "DON-90418",
    donor: "Tunde Bakare",
    type: "Recurring Donation",
    campaignId: "CMP-3103",
    amount: 75_000,
    date: "2026-08-14T07:45:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Card",
    recurringCadence: "Monthly",
  },
  {
    id: "DON-90419",
    donor: "Grace Etim",
    type: "Patient Donation",
    campaignId: "CMP-3106",
    amount: 65_000,
    date: "2026-08-14T13:22:00",
    payment: "Failed",
    status: "Held",
    channel: "Card",
  },
  {
    id: "DON-90420",
    donor: "Oluwaseun Adeniyi",
    type: "Cause Donation",
    causeId: "CAU-06",
    amount: 300_000,
    date: "2026-08-13T16:58:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Card",
  },
  {
    id: "DON-90421",
    donor: "Bola Adekunle",
    type: "Patient Donation",
    campaignId: "CMP-3110",
    amount: 500_000,
    date: "2026-08-13T09:30:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Bank transfer",
  },
  {
    id: "DON-90422",
    donor: "Ngozi Okafor",
    type: "Recurring Donation",
    causeId: "CAU-02",
    amount: 25_000,
    date: "2026-08-12T21:11:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Card",
    recurringCadence: "Monthly",
  },
  {
    id: "DON-90423",
    donor: "Sadiq Abubakar",
    type: "Patient Donation",
    campaignId: "CMP-3109",
    amount: 180_000,
    date: "2026-08-12T12:04:00",
    payment: "Paid",
    status: "Allocated",
    channel: "USSD",
  },
  {
    id: "DON-90424",
    donor: "Peace Udo",
    type: "Cause Donation",
    causeId: "CAU-03",
    amount: 750_000,
    date: "2026-08-11T17:39:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Bank transfer",
  },
  {
    id: "DON-90425",
    donor: "Kelechi Anyanwu",
    type: "Patient Donation",
    campaignId: "CMP-3108",
    amount: 220_000,
    date: "2026-08-11T08:20:00",
    payment: "Refunded",
    status: "Reversed",
    channel: "Card",
  },
  {
    id: "DON-90426",
    donor: "Fatima Idris",
    type: "Cause Donation",
    causeId: "CAU-01",
    amount: 95_000,
    date: "2026-08-10T19:48:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Card",
  },
  {
    id: "DON-90427",
    donor: "Segun Fashola",
    type: "Patient Donation",
    campaignId: "CMP-3101",
    amount: 1_000_000,
    date: "2026-08-09T14:15:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Bank transfer",
  },
  {
    id: "DON-90428",
    donor: "Amaka Onyeka",
    type: "Recurring Donation",
    causeId: "CAU-04",
    amount: 40_000,
    date: "2026-08-08T06:55:00",
    payment: "Paid",
    status: "Allocated",
    channel: "Card",
  },
];

export const transfers: Transfer[] = [
  {
    id: "TRF-5201",
    patientId: "PT-2043",
    campaignId: "CMP-3103",
    fromHospitalId: "HSP-1004",
    requiredService: "Radiotherapy",
    recommendedHospitalId: "HSP-1002",
    urgency: "Urgent",
    date: "2026-08-17",
    status: "Submitted",
    reason:
      "Radiotherapy is not available at the current facility. Patient has completed chemotherapy and requires radiotherapy within three weeks.",
    treatmentPhase: "Post-chemotherapy, awaiting radiotherapy",
    treatmentPlan: "25 radiotherapy fractions over five weeks with weekly oncology review.",
    timeline: [{ status: "Submitted", at: "2026-08-17 08:20", by: "AKTH Oncology" }],
  },
  {
    id: "TRF-5202",
    patientId: "PT-2048",
    campaignId: "CMP-3108",
    fromHospitalId: "HSP-1006",
    requiredService: "Surgery",
    recommendedHospitalId: "HSP-1005",
    urgency: "Critical",
    date: "2026-08-16",
    status: "Under Review",
    reason:
      "Theatre capacity constrained at current facility; orthopaedic fixation required within 7 days.",
    treatmentPhase: "Stabilised trauma patient",
    treatmentPlan: "Open reduction and internal fixation followed by physiotherapy.",
    timeline: [
      { status: "Submitted", at: "2026-08-16 10:02", by: "RSUTH Trauma" },
      { status: "Under Review", at: "2026-08-16 14:40", by: "Admin — Ada Nwankwo" },
    ],
  },
  {
    id: "TRF-5203",
    patientId: "PT-2042",
    campaignId: "CMP-3102",
    fromHospitalId: "HSP-1003",
    requiredService: "Dialysis",
    recommendedHospitalId: "HSP-1001",
    urgency: "Routine",
    date: "2026-08-12",
    status: "Receiving Hospital Pending",
    reason: "Patient relocation to Lagos; dialysis continuity required.",
    treatmentPhase: "Maintenance dialysis",
    treatmentPlan: "Twice-weekly haemodialysis with monthly nephrology review.",
    receivingHospitalId: "HSP-1001",
    timeline: [
      { status: "Submitted", at: "2026-08-12 09:15", by: "UCH Nephrology" },
      { status: "Under Review", at: "2026-08-12 12:30", by: "Admin — Ada Nwankwo" },
      {
        status: "Receiving Hospital Pending",
        at: "2026-08-13 09:05",
        by: "Admin — Ada Nwankwo",
        note: "Approved to LUTH",
      },
    ],
  },
  {
    id: "TRF-5204",
    patientId: "PT-2047",
    campaignId: "CMP-3107",
    fromHospitalId: "HSP-1003",
    requiredService: "Surgery",
    recommendedHospitalId: "HSP-1002",
    receivingHospitalId: "HSP-1002",
    urgency: "Urgent",
    date: "2026-07-14",
    status: "Treatment Commenced",
    reason: "Transplant programme available only at the receiving facility.",
    treatmentPhase: "Transplant workup",
    treatmentPlan: "Donor matching, transplant surgery and immunosuppressant regimen.",
    timeline: [
      { status: "Submitted", at: "2026-07-14 08:00", by: "UCH Nephrology" },
      { status: "Under Review", at: "2026-07-14 11:20", by: "Admin — Ada Nwankwo" },
      { status: "Receiving Hospital Pending", at: "2026-07-14 16:10", by: "Admin — Ada Nwankwo" },
      { status: "Accepted", at: "2026-07-15 09:40", by: "National Hospital Abuja" },
      { status: "Patient Notified", at: "2026-07-15 12:00", by: "Admin — Ada Nwankwo" },
      { status: "Transfer Scheduled", at: "2026-07-16 10:30", by: "Admin — Ada Nwankwo" },
      { status: "Treatment Commenced", at: "2026-07-22 08:15", by: "National Hospital Abuja" },
    ],
  },
  {
    id: "TRF-5205",
    patientId: "PT-2050",
    campaignId: "CMP-3110",
    fromHospitalId: "HSP-1004",
    requiredService: "MRI",
    recommendedHospitalId: "HSP-1005",
    receivingHospitalId: "HSP-1005",
    urgency: "Routine",
    date: "2026-08-05",
    status: "Accepted",
    reason: "MRI staging scan required before surgical review.",
    treatmentPhase: "Chemotherapy cycle 1 complete",
    treatmentPlan: "MRI staging then multidisciplinary surgical planning.",
    timeline: [
      { status: "Submitted", at: "2026-08-05 09:00", by: "AKTH Oncology" },
      { status: "Under Review", at: "2026-08-05 15:20", by: "Admin — Tola Adegoke" },
      { status: "Receiving Hospital Pending", at: "2026-08-06 09:30", by: "Admin — Tola Adegoke" },
      { status: "Accepted", at: "2026-08-07 08:45", by: "UNTH Enugu" },
    ],
  },
  {
    id: "TRF-5206",
    patientId: "PT-2049",
    campaignId: "CMP-3109",
    fromHospitalId: "HSP-1001",
    requiredService: "Physiotherapy",
    recommendedHospitalId: "HSP-1005",
    receivingHospitalId: "HSP-1005",
    urgency: "Routine",
    date: "2026-07-28",
    status: "Completed",
    reason: "Structured physiotherapy programme closer to patient's residence.",
    treatmentPhase: "Wound care stable",
    treatmentPlan: "Eight-week physiotherapy programme.",
    timeline: [
      { status: "Submitted", at: "2026-07-28 10:10", by: "LUTH Endocrinology" },
      { status: "Under Review", at: "2026-07-28 13:00", by: "Admin — Ada Nwankwo" },
      { status: "Receiving Hospital Pending", at: "2026-07-29 09:00", by: "Admin — Ada Nwankwo" },
      { status: "Accepted", at: "2026-07-29 15:30", by: "UNTH Enugu" },
      { status: "Patient Notified", at: "2026-07-30 09:10", by: "Admin — Ada Nwankwo" },
      { status: "Transfer Scheduled", at: "2026-07-31 11:00", by: "Admin — Ada Nwankwo" },
      { status: "Treatment Commenced", at: "2026-08-03 08:00", by: "UNTH Enugu" },
      { status: "Completed", at: "2026-08-14 16:20", by: "UNTH Enugu" },
    ],
  },
  {
    id: "TRF-5207",
    patientId: "PT-2045",
    campaignId: "CMP-3105",
    fromHospitalId: "HSP-1002",
    requiredService: "Cardiology",
    recommendedHospitalId: "HSP-1005",
    urgency: "Urgent",
    date: "2026-08-08",
    status: "Rejected",
    reason: "Requested cardiac catheterisation slot at alternative facility.",
    treatmentPhase: "Pre-operative assessment",
    treatmentPlan: "Coronary angioplasty with stent placement.",
    timeline: [
      { status: "Submitted", at: "2026-08-08 09:25", by: "NHA Cardiology" },
      { status: "Under Review", at: "2026-08-08 14:00", by: "Admin — Tola Adegoke" },
      {
        status: "Rejected",
        at: "2026-08-09 10:15",
        by: "Admin — Tola Adegoke",
        note: "Current facility retains capability; transfer unnecessary.",
      },
    ],
  },
  {
    id: "TRF-5208",
    patientId: "PT-2046",
    campaignId: "CMP-3106",
    fromHospitalId: "HSP-1003",
    requiredService: "Paediatrics",
    recommendedHospitalId: "HSP-1001",
    urgency: "Routine",
    date: "2026-08-02",
    status: "Cancelled",
    reason: "Guardian requested treatment to remain at the current facility.",
    treatmentPhase: "Pre-surgical",
    treatmentPlan: "Paediatric hernia repair.",
    timeline: [
      { status: "Submitted", at: "2026-08-02 08:40", by: "UCH Paediatrics" },
      { status: "Cancelled", at: "2026-08-04 09:50", by: "Admin — Ada Nwankwo" },
    ],
  },
  {
    id: "TRF-5209",
    patientId: "PT-2041",
    campaignId: "CMP-3101",
    fromHospitalId: "HSP-1001",
    requiredService: "Radiotherapy",
    recommendedHospitalId: "HSP-1002",
    urgency: "Routine",
    date: "2026-08-15",
    status: "Submitted",
    reason: "Linear accelerator at current facility under maintenance until October.",
    treatmentPhase: "Chemotherapy cycle 3 complete",
    treatmentPlan: "20 radiotherapy fractions following chemotherapy completion.",
    timeline: [{ status: "Submitted", at: "2026-08-15 11:35", by: "LUTH Oncology" }],
  },
  {
    id: "TRF-5210",
    patientId: "PT-2048",
    campaignId: "CMP-3108",
    fromHospitalId: "HSP-1006",
    requiredService: "ICU",
    recommendedHospitalId: "HSP-1005",
    receivingHospitalId: "HSP-1005",
    urgency: "Critical",
    date: "2026-08-10",
    status: "Transfer Scheduled",
    reason: "Higher-level intensive care required for post-operative monitoring.",
    treatmentPhase: "Post-stabilisation",
    treatmentPlan: "ICU monitoring for 72 hours post-surgery.",
    timeline: [
      { status: "Submitted", at: "2026-08-10 07:05", by: "RSUTH Trauma" },
      { status: "Under Review", at: "2026-08-10 09:00", by: "Admin — Ada Nwankwo" },
      { status: "Receiving Hospital Pending", at: "2026-08-10 13:20", by: "Admin — Ada Nwankwo" },
      { status: "Accepted", at: "2026-08-11 08:30", by: "UNTH Enugu" },
      { status: "Patient Notified", at: "2026-08-11 10:00", by: "Admin — Ada Nwankwo" },
      { status: "Transfer Scheduled", at: "2026-08-12 09:45", by: "Admin — Ada Nwankwo" },
    ],
  },
];

export const auditSeed: AuditEntry[] = [
  {
    id: "AUD-7701",
    at: "2026-08-17 08:22",
    user: "Ada Nwankwo",
    role: "Super Admin",
    action: "Transfer Submitted",
    recordType: "Transfer",
    record: "TRF-5201",
    description: "Radiotherapy transfer request received from Aminu Kano Teaching Hospital.",
  },
  {
    id: "AUD-7702",
    at: "2026-08-16 14:41",
    user: "Ada Nwankwo",
    role: "Super Admin",
    action: "Transfer Reviewed",
    recordType: "Transfer",
    record: "TRF-5202",
    description: "Critical trauma transfer moved to Under Review.",
  },
  {
    id: "AUD-7703",
    at: "2026-08-16 09:10",
    user: "Tola Adegoke",
    role: "Operations Admin",
    action: "Campaign Status Changed",
    recordType: "Campaign",
    record: "CMP-3105",
    description: "Angioplasty campaign placed Under Review pending hospital cost breakdown.",
  },
  {
    id: "AUD-7704",
    at: "2026-08-15 16:05",
    user: "Ada Nwankwo",
    role: "Super Admin",
    action: "Cause Updated",
    recordType: "Cause",
    record: "CAU-05",
    description: "Emergency Care funding target reviewed for Q3 2026.",
  },
  {
    id: "AUD-7705",
    at: "2026-08-14 11:48",
    user: "Ifeoma Bassey",
    role: "Finance Admin",
    action: "Donation Reviewed",
    recordType: "Donation",
    record: "DON-90419",
    description: "Failed card payment held for donor follow-up.",
  },
  {
    id: "AUD-7706",
    at: "2026-08-13 09:06",
    user: "Ada Nwankwo",
    role: "Super Admin",
    action: "Transfer Approved",
    recordType: "Transfer",
    record: "TRF-5203",
    description: "Dialysis transfer approved to Lagos University Teaching Hospital.",
  },
  {
    id: "AUD-7707",
    at: "2026-08-11 08:31",
    user: "Receiving Hospital Desk",
    role: "Hospital",
    action: "Patient Transfer Accepted",
    recordType: "Transfer",
    record: "TRF-5210",
    description: "UNTH Enugu accepted the ICU transfer request.",
  },
  {
    id: "AUD-7708",
    at: "2026-08-09 10:16",
    user: "Tola Adegoke",
    role: "Operations Admin",
    action: "Transfer Rejected",
    recordType: "Transfer",
    record: "TRF-5207",
    description: "Cardiology transfer rejected — capability retained at current facility.",
  },
  {
    id: "AUD-7709",
    at: "2026-08-06 15:20",
    user: "Ada Nwankwo",
    role: "Super Admin",
    action: "Hospital Verified",
    recordType: "Hospital",
    record: "HSP-1005",
    description: "UNTH Enugu accreditation documents verified.",
  },
  {
    id: "AUD-7710",
    at: "2026-07-28 12:02",
    user: "Ada Nwankwo",
    role: "Super Admin",
    action: "Cause Deactivated",
    recordType: "Cause",
    record: "CAU-07",
    description: "Cardiovascular Care paused pending partner cardiology capacity review.",
  },
];

export const donationSeries = [
  { month: "Feb", patient: 9_200_000, cause: 4_100_000 },
  { month: "Mar", patient: 11_400_000, cause: 5_600_000 },
  { month: "Apr", patient: 10_100_000, cause: 6_800_000 },
  { month: "May", patient: 13_800_000, cause: 7_200_000 },
  { month: "Jun", patient: 15_600_000, cause: 9_400_000 },
  { month: "Jul", patient: 17_250_000, cause: 10_900_000 },
  { month: "Aug", patient: 12_480_000, cause: 8_150_000 },
];

export const recurringDonors = 428;
export const totalDonationsAmount = 184_620_000;

export const causeImageOptions = [
  { id: "oncology", label: "Oncology ward" },
  { id: "renal", label: "Dialysis unit" },
  { id: "maternal", label: "Maternity care" },
  { id: "emergency", label: "Emergency response" },
  { id: "surgery", label: "Surgical theatre" },
  { id: "endocrine", label: "Endocrine clinic" },
  { id: "cardiac", label: "Cardiac care" },
];
