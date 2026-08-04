export type Campaign = {
  id: string;
  patient: string;
  age: number;
  condition: string;
  category: string;
  hospital: string;
  location: string;
  goal: number;
  raised: number;
  donors: number;
  urgency: "Critical" | "Urgent" | "Scheduled";
  daysLeft: number;
  story: string;
  diagnosisSummary: string;
  treatmentPlan: { label: string; detail: string }[];
  costBreakdown: { item: string; min: number; max: number }[];
  updates: { date: string; title: string; detail: string }[];
  image: string;
};

export const hospitals = [
  {
    id: "alliance",
    name: "Alliance Hospital",
    area: "Wuse II, Abuja",
    specialties: ["Oncology", "Fertility", "General Surgery"],
    verifiedSince: "2026",
    campaigns: 12,
    treated: 38,
  },
  {
    id: "nnpc",
    name: "NNPC Multispecialty Hospital",
    area: "Central Business District, Abuja",
    specialties: ["Cardiology", "Nephrology", "Trauma"],
    verifiedSince: "2026",
    campaigns: 9,
    treated: 24,
  },
  {
    id: "cedarcrest",
    name: "Cedarcrest Hospital",
    area: "Gudu District, Abuja",
    specialties: ["Orthopaedics", "Neurosurgery", "Paediatrics"],
    verifiedSince: "2026",
    campaigns: 15,
    treated: 41,
  },
  {
    id: "nisa",
    name: "Nisa Premier Hospital",
    area: "Jabi, Abuja",
    specialties: ["Maternal Care", "Paediatrics", "Internal Medicine"],
    verifiedSince: "2026",
    campaigns: 7,
    treated: 19,
  },
];

export const campaigns: Campaign[] = [
  {
    id: "amina-k",
    patient: "Amina Kabir",
    age: 34,
    condition: "Stage II Breast Cancer",
    category: "Oncology",
    hospital: "Alliance Hospital",
    location: "Wuse II, Abuja",
    goal: 12000000,
    raised: 7350000,
    donors: 214,
    urgency: "Urgent",
    daysLeft: 21,
    story:
      "Amina is a tailor and a mother of three from Kubwa. In March she found a lump that would not go away. A biopsy at Alliance Hospital confirmed stage II breast cancer. She has already sold her sewing machines to pay for the first two investigations, and without surgery followed by six cycles of chemotherapy her doctors expect the disease to spread within months. Amina wants to be there when her youngest starts primary school.",
    diagnosisSummary:
      "Invasive ductal carcinoma, left breast, stage IIB. No distant metastasis on staging CT. Candidate for modified radical mastectomy followed by adjuvant chemotherapy.",
    treatmentPlan: [
      { label: "Investigations", detail: "Staging CT, echocardiogram, full blood workup" },
      { label: "Procedure", detail: "Modified radical mastectomy with axillary clearance" },
      { label: "Medication", detail: "Six cycles adjuvant chemotherapy over 18 weeks" },
      { label: "Recovery", detail: "3-month post-treatment review and physiotherapy" },
    ],
    costBreakdown: [
      { item: "Laboratory & imaging", min: 850000, max: 1200000 },
      { item: "Surgical procedure", min: 3200000, max: 4100000 },
      { item: "Medication (chemotherapy)", min: 3400000, max: 3900000 },
      { item: "Consumables & admission", min: 620000, max: 800000 },
    ],
    updates: [
      { date: "12 Jul 2026", title: "Campaign verified and published", detail: "Alliance Hospital approved the treatment plan and cost estimate." },
      { date: "24 Jul 2026", title: "Pre-surgery workup completed", detail: "₦910,000 disbursed to the hospital for staging and labs." },
    ],
    image: "oncology",
  },
  {
    id: "tunde-a",
    patient: "Tunde Adeyemi",
    age: 7,
    condition: "Congenital Heart Defect",
    category: "Cardiology",
    hospital: "NNPC Multispecialty Hospital",
    location: "CBD, Abuja",
    goal: 9600000,
    raised: 8940000,
    donors: 388,
    urgency: "Critical",
    daysLeft: 9,
    story:
      "Tunde was born with a hole in his heart. He tires after a few steps and has missed most of primary two. Cardiologists at NNPC Multispecialty Hospital say corrective surgery now gives him a normal life expectancy; waiting another year risks irreversible pulmonary damage. His father is a security guard and his mother sells groundnuts at Utako market.",
    diagnosisSummary:
      "Large perimembranous ventricular septal defect with left-to-right shunt. Early pulmonary hypertension. Surgical closure indicated without delay.",
    treatmentPlan: [
      { label: "Investigations", detail: "Repeat echocardiogram, cardiac catheterisation" },
      { label: "Procedure", detail: "Open surgical VSD closure with cardiopulmonary bypass" },
      { label: "Medication", detail: "Peri-operative antibiotics and diuretics" },
      { label: "Recovery", detail: "7-day ICU and ward admission, 3-month cardiac follow-up" },
    ],
    costBreakdown: [
      { item: "Laboratory & imaging", min: 520000, max: 700000 },
      { item: "Surgical procedure", min: 4800000, max: 5600000 },
      { item: "ICU & admission", min: 1100000, max: 1500000 },
      { item: "Medication & consumables", min: 180000, max: 260000 },
    ],
    updates: [
      { date: "02 Jul 2026", title: "Campaign verified and published", detail: "Hospital assessment reviewed and approved by the FundEzer clinical team." },
      { date: "28 Jul 2026", title: "Surgery date provisionally booked", detail: "Theatre slot reserved pending completion of funding." },
    ],
    image: "paediatric",
  },
  {
    id: "grace-o",
    patient: "Grace Okonkwo",
    age: 52,
    condition: "End-Stage Kidney Disease",
    category: "Nephrology",
    hospital: "Cedarcrest Hospital",
    location: "Gudu, Abuja",
    goal: 6400000,
    raised: 2180000,
    donors: 96,
    urgency: "Urgent",
    daysLeft: 34,
    story:
      "Grace taught mathematics for twenty-six years. She now needs dialysis three times a week while she waits for a transplant assessment. Each missed session sends her to the emergency room. Her pension covers one session a month. Funding a year of dialysis keeps her stable and on the transplant pathway.",
    diagnosisSummary:
      "Chronic kidney disease stage 5 secondary to hypertensive nephrosclerosis. Maintenance haemodialysis required pending transplant workup.",
    treatmentPlan: [
      { label: "Investigations", detail: "Monthly renal panel, transplant compatibility screening" },
      { label: "Procedure", detail: "Thrice-weekly haemodialysis, AV fistula maintenance" },
      { label: "Medication", detail: "Erythropoietin, phosphate binders, antihypertensives" },
      { label: "Recovery", detail: "Quarterly nephrology review and transplant assessment" },
    ],
    costBreakdown: [
      { item: "Dialysis sessions (12 months)", min: 4200000, max: 4900000 },
      { item: "Laboratory monitoring", min: 480000, max: 640000 },
      { item: "Medication", min: 520000, max: 700000 },
      { item: "Consumables", min: 130000, max: 190000 },
    ],
    updates: [
      { date: "18 Jul 2026", title: "Campaign verified and published", detail: "Cedarcrest Hospital confirmed the dialysis schedule and costs." },
    ],
    image: "dialysis",
  },
  {
    id: "ibrahim-s",
    patient: "Ibrahim Sule",
    age: 29,
    condition: "Compound Femur Fracture",
    category: "Orthopaedics",
    hospital: "Cedarcrest Hospital",
    location: "Gudu, Abuja",
    goal: 3800000,
    raised: 1420000,
    donors: 61,
    urgency: "Urgent",
    daysLeft: 27,
    story:
      "Ibrahim rides a delivery bike in Abuja. A car turned into him on Airport Road and shattered his right femur. He is stable but immobile, and surgery is the difference between walking again and permanent disability. He supports his mother and two younger siblings.",
    diagnosisSummary:
      "Compound mid-shaft femoral fracture, right leg, with soft tissue injury. Requires open reduction and internal fixation.",
    treatmentPlan: [
      { label: "Investigations", detail: "X-ray series, CT of the affected limb" },
      { label: "Procedure", detail: "Open reduction and internal fixation with intramedullary nail" },
      { label: "Medication", detail: "IV antibiotics, analgesia, thromboprophylaxis" },
      { label: "Recovery", detail: "10-week guided physiotherapy programme" },
    ],
    costBreakdown: [
      { item: "Imaging", min: 210000, max: 300000 },
      { item: "Surgical procedure & implant", min: 2100000, max: 2600000 },
      { item: "Admission & consumables", min: 380000, max: 520000 },
      { item: "Physiotherapy", min: 240000, max: 340000 },
    ],
    updates: [
      { date: "22 Jul 2026", title: "Campaign verified and published", detail: "Orthopaedic assessment and implant costing approved." },
    ],
    image: "orthopaedic",
  },
  {
    id: "halima-b",
    patient: "Halima Bello",
    age: 26,
    condition: "Emergency Caesarean & Neonatal Care",
    category: "Maternal Care",
    hospital: "Nisa Premier Hospital",
    location: "Jabi, Abuja",
    goal: 2900000,
    raised: 2610000,
    donors: 143,
    urgency: "Critical",
    daysLeft: 5,
    story:
      "Halima is 33 weeks pregnant with severe pre-eclampsia. Her doctors need to deliver early and place the baby in neonatal intensive care. Her husband lost his job in May. Every day of delay increases the risk to both of them.",
    diagnosisSummary:
      "Severe pre-eclampsia at 33 weeks gestation. Planned pre-term caesarean delivery with neonatal intensive care support.",
    treatmentPlan: [
      { label: "Investigations", detail: "Serial BP monitoring, foetal doppler, renal profile" },
      { label: "Procedure", detail: "Emergency caesarean section" },
      { label: "Medication", detail: "Magnesium sulphate, antihypertensives, steroids for lung maturity" },
      { label: "Recovery", detail: "Up to 21 days neonatal ICU, 6-week maternal follow-up" },
    ],
    costBreakdown: [
      { item: "Laboratory & monitoring", min: 190000, max: 280000 },
      { item: "Caesarean delivery", min: 850000, max: 1100000 },
      { item: "Neonatal intensive care", min: 1050000, max: 1400000 },
      { item: "Medication & consumables", min: 160000, max: 240000 },
    ],
    updates: [
      { date: "27 Jul 2026", title: "Campaign verified and published", detail: "Nisa Premier Hospital flagged this application as critical urgency." },
    ],
    image: "maternal",
  },
  {
    id: "chidi-e",
    patient: "Chidi Eze",
    age: 41,
    condition: "Brain Tumour (Meningioma)",
    category: "Neurosurgery",
    hospital: "Cedarcrest Hospital",
    location: "Gudu, Abuja",
    goal: 14500000,
    raised: 3150000,
    donors: 88,
    urgency: "Scheduled",
    daysLeft: 46,
    story:
      "Chidi began losing vision in his left eye and having seizures at work. An MRI revealed a benign but growing meningioma pressing on his optic nerve. Surgery has a very high success rate if performed before further compression. He is a civil servant and the sole earner for a family of five.",
    diagnosisSummary:
      "Left sphenoid wing meningioma with optic nerve compression. Elective craniotomy and tumour resection recommended.",
    treatmentPlan: [
      { label: "Investigations", detail: "Contrast MRI, neuro-ophthalmic assessment, EEG" },
      { label: "Procedure", detail: "Craniotomy with microsurgical tumour resection" },
      { label: "Medication", detail: "Anti-epileptics, steroids, post-operative antibiotics" },
      { label: "Recovery", detail: "ICU stay, neuro-rehabilitation, 3-month imaging review" },
    ],
    costBreakdown: [
      { item: "Imaging (MRI/CT)", min: 900000, max: 1300000 },
      { item: "Craniotomy & theatre", min: 7800000, max: 9200000 },
      { item: "ICU & admission", min: 1400000, max: 1900000 },
      { item: "Medication & rehabilitation", min: 480000, max: 700000 },
    ],
    updates: [
      { date: "09 Jul 2026", title: "Campaign verified and published", detail: "Neurosurgical plan reviewed by two consultants before approval." },
    ],
    image: "neuro",
  },
];

export const successStories = [
  {
    name: "Ngozi Umeh",
    condition: "Kidney transplant",
    hospital: "Cedarcrest Hospital",
    raised: 11200000,
    donors: 412,
    quote:
      "I had accepted that dialysis was the rest of my life. Nine weeks after my campaign went live I had a transplant. I am back at my shop.",
  },
  {
    name: "Baby Zainab",
    condition: "Neonatal surgery",
    hospital: "Nisa Premier Hospital",
    raised: 4300000,
    donors: 267,
    quote:
      "Strangers paid for my daughter's surgery directly to the hospital. I never touched the money and I never had to beg anyone.",
  },
  {
    name: "Samuel Ochai",
    condition: "Spinal fixation",
    hospital: "Alliance Hospital",
    raised: 6800000,
    donors: 189,
    quote:
      "The updates kept coming even after surgery. My donors saw me stand up again. That is what made them give in the first place.",
  },
];

export const faqs = [
  {
    q: "Does FundEzer send money to patients?",
    a: "No. Every naira raised is paid directly to the verified partner hospital treating the patient, released against approved treatment milestones. Patients never receive cash.",
  },
  {
    q: "How do you verify that a campaign is genuine?",
    a: "A campaign only exists after a partner hospital has reviewed the patient's documents, written a clinical assessment and approved a cost estimate. Every application also passes AI fraud screening for duplicate stories, manipulated images, forged documents and repeated identities, and high-risk cases go to a human analyst before publication.",
  },
  {
    q: "Who can apply for sponsorship?",
    a: "During the MVP pilot, patients receiving care at one of our verified partner hospitals in Abuja, Nigeria. Other states will open as we onboard more hospitals.",
  },
  {
    q: "How is the campaign goal decided?",
    a: "The hospital submits a minimum and maximum treatment estimate. FundEzer recommends a goal of roughly 20% above the maximum to cover clinical contingencies, and the hospital approves or rejects that recommendation.",
  },
  {
    q: "What happens if a campaign is not fully funded?",
    a: "Funds stay in the campaign wallet and are used for the treatment stages they can cover, in consultation with the hospital. Nothing is released outside the approved treatment plan.",
  },
  {
    q: "How can I pay?",
    a: "Card and bank transfer are supported at launch. Mobile wallet payments arrive in a later phase.",
  },
  {
    q: "Will I know how my donation was used?",
    a: "Yes. Every campaign shows funds raised, payments made to the hospital, remaining wallet balance and treatment updates posted by the hospital.",
  },
  {
    q: "How does a hospital become a partner?",
    a: "Hospitals complete a verification process covering licensing, facilities and finance contacts before they can review applications or receive payments. Contact our partnerships team to begin.",
  },
];

export function formatNaira(value: number) {
  return "₦" + value.toLocaleString("en-NG");
}

export function formatShort(value: number) {
  if (value >= 1000000) return "₦" + (value / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (value >= 1000) return "₦" + Math.round(value / 1000) + "K";
  return "₦" + value;
}