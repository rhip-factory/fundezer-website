import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { listPartnerHospitals, type PartnerHospital } from "@/lib/patient/hospitals.functions";
import {
  getPortalOverview,
  markAllNotificationsRead,
  markNotificationRead,
  savePortalProfile,
  type PortalOverview,
} from "@/lib/patient/portal.functions";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type NotificationKind =
  | "application"
  | "campaign"
  | "donation"
  | "treatment";

export type PortalNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  read: boolean;
  target: string;
};

export type PortalDocument = {
  id: string;
  name: string;
  category: "Medical" | "Identity" | "Treatment" | "Supporting";
  type: string;
  date: string;
  status: "Verified" | "Under review" | "Action needed";
};

export type PatientProfile = {
  fullName: string;
  email: string;
  phone: string;
  nin: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  kinName: string;
  kinPhone: string;
  kinRelation: string;
};

export type UploadStatus = "empty" | "uploading" | "uploaded" | "error";

export type UploadSlot = {
  status: UploadStatus;
  fileName?: string;
  progress: number;
};

export type DocSpec = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  fileName: string;
};

/* ------------------------------------------------------------------ */
/* Portal seed data                                                   */
/* ------------------------------------------------------------------ */

export const hospitals = [
  {
    id: "alliance",
    name: "Alliance Hospital",
    city: "Abuja",
    specialty: "Multispecialty & fertility care",
  },
  {
    id: "nnpc",
    name: "NNPC Multispecialty Hospital",
    city: "Abuja",
    specialty: "General & specialist medicine",
  },
  {
    id: "cedarcrest",
    name: "Cedarcrest Hospital",
    city: "Abuja",
    specialty: "Cardiology, orthopaedics & surgery",
  },
  {
    id: "nisa",
    name: "Nisa Premier Hospital",
    city: "Abuja",
    specialty: "Maternal health & surgery",
  },
];

export const storyQuestions = [
  {
    id: "illness",
    question: "What illness do you have?",
    helper: "Use the name your doctor gave you, in your own words.",
    placeholder: "For example: a heart valve problem called mitral valve defect",
  },
  {
    id: "diagnosed",
    question: "When were you diagnosed?",
    helper: "An approximate month and year is fine.",
    placeholder: "For example: April 2026",
  },
  {
    id: "who",
    question: "Who diagnosed you?",
    helper: "The hospital, clinic or doctor who confirmed your condition.",
    placeholder: "For example: the cardiology team at Cedarcrest Hospital",
  },
  {
    id: "before",
    question: "Have you received treatment before?",
    helper: "Tell us about any medication, tests or procedures so far.",
    placeholder: "For example: I have been on medication since May 2026",
  },
  {
    id: "affects",
    question: "How does the illness affect your life?",
    helper: "Share how it affects your work, family or daily routine.",
    placeholder: "For example: I get breathless and can no longer teach full days",
  },
  {
    id: "why",
    question: "Why do you need financial support?",
    helper: "Help donors understand your situation. No judgement here.",
    placeholder: "For example: the surgery costs far more than my family can raise",
  },
  {
    id: "delayed",
    question: "What happens if treatment is delayed?",
    helper: "Share what your doctors have told you about waiting.",
    placeholder: "For example: my doctors say my heart function will keep weakening",
  },
] as const;

export const documentSpecs: DocSpec[] = [
  {
    id: "diagnosis",
    title: "Diagnosis",
    description: "A signed diagnosis report from your doctor or hospital.",
    required: true,
    fileName: "Diagnosis_Report.pdf",
  },
  {
    id: "labs",
    title: "Lab reports",
    description: "Blood work or laboratory results related to your condition.",
    required: true,
    fileName: "Lab_Results_Aug2026.pdf",
  },
  {
    id: "prescriptions",
    title: "Prescriptions",
    description: "Current medication prescribed by your care team.",
    required: true,
    fileName: "Prescription_List.pdf",
  },
  {
    id: "scans",
    title: "Scans",
    description: "Echo, X-ray, MRI or other imaging reports.",
    required: true,
    fileName: "Echocardiogram_Report.pdf",
  },
  {
    id: "pictures",
    title: "Pictures",
    description: "A clear photo of yourself for your campaign page.",
    required: true,
    fileName: "Patient_Photo.jpg",
  },
  {
    id: "govid",
    title: "Government ID",
    description: "National ID, voter's card, passport or driver's licence.",
    required: true,
    fileName: "National_ID_Card.jpg",
  },
  {
    id: "videos",
    title: "Videos",
    description: "An optional short video message for donors.",
    required: false,
    fileName: "Patient_Message.mp4",
  },
  {
    id: "referral",
    title: "Referral letters",
    description: "Letters referring you to your selected hospital.",
    required: false,
    fileName: "Referral_Letter.pdf",
  },
  {
    id: "supporting",
    title: "Supporting documents",
    description: "Anything else that supports your application.",
    required: false,
    fileName: "Guardian_Consent.pdf",
  },
];

const emptyProfile: PatientProfile = {
  fullName: "",
  email: "",
  phone: "",
  nin: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  kinName: "",
  kinPhone: "",
  kinRelation: "",
};

const savedAnswers = [
  "A heart valve problem my doctors call a severe mitral valve defect.",
  "April 2026, after months of breathlessness.",
  "The cardiology team at Cedarcrest Hospital, Abuja.",
  "Yes, I have been on medication since May 2026 and had two reviews.",
  "I get breathless climbing stairs and can no longer teach full school days.",
  "The surgery costs far more than my family can raise on a teacher's salary.",
  "My doctors say my heart function will keep weakening and the risk grows.",
];

/* ------------------------------------------------------------------ */
/* Story generation                                                   */
/* ------------------------------------------------------------------ */

export function buildStory(answers: string[], name: string) {
  const first = (name || "The patient").trim().split(" ")[0];
  const [illness, when, who, before, affects, why, delayed] = answers.map((a) =>
    (a || "").trim().replace(/\.$/, ""),
  );
  const parts = [
    `${first} is living with ${illness || "a serious medical condition"}, diagnosed in ${when || "recent months"} by ${who || "a partner hospital care team"}.`,
    before
      ? `So far, ${first} has managed the condition as best as possible: ${before.toLowerCase()}.`
      : `${first} has not been able to begin the treatment that is now needed.`,
    affects ? `Day to day, ${affects.toLowerCase()}.` : "",
    why
      ? `${first} is asking for help because ${why.toLowerCase()}.`
      : `${first} is asking for help to cover the cost of treatment.`,
    delayed
      ? `If treatment is delayed, ${delayed.toLowerCase()}.`
      : "",
    `Every donation goes directly to the verified partner hospital handling ${first}'s care, so support reaches treatment and nothing else.`,
  ].filter(Boolean);
  const words = parts.join(" ").split(/\s+/);
  return words.slice(0, 200).join(" ");
}

export const wordCount = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

/* ------------------------------------------------------------------ */
/* Context                                                            */
/* ------------------------------------------------------------------ */

type FlowState = {
  country: string;
  state: string;
  hospitalId: string | null;
  answers: string[];
  story: string;
  campaignTitle: string;
  summary: string;
  uploads: Record<string, UploadSlot>;
  submitted: boolean;
};

const emptyUploads = (): Record<string, UploadSlot> =>
  Object.fromEntries(
    documentSpecs.map((d) => [d.id, { status: "empty", progress: 0 }]),
  ) as Record<string, UploadSlot>;

const initialFlow: FlowState = {
  country: "",
  state: "",
  hospitalId: null,
  answers: storyQuestions.map(() => ""),
  story: "",
  campaignTitle: "",
  summary: "",
  uploads: emptyUploads(),
  submitted: false,
};

type PortalContextValue = {
  /* application flow */
  flow: FlowState;
  setLocation: (country: string, state: string) => void;
  setHospital: (id: string) => void;
  setAnswer: (index: number, value: string) => void;
  setStory: (value: string) => void;
  setCampaign: (patch: Partial<Pick<FlowState, "campaignTitle" | "summary">>) => void;
  startUpload: (id: string) => void;
  removeUpload: (id: string) => void;
  markSubmitted: () => void;
  resetFlow: () => void;
  prefillSavedApplication: () => void;
  requiredUploaded: number;
  requiredTotal: number;
  missingRequired: DocSpec[];
  hospitalName: string;
  partnerHospitals: PartnerHospital[];
  hospitalsLoading: boolean;
  hospitalsError: string | null;
  /* live portal data */
  portal: PortalOverview | null;
  isPortalLoading: boolean;
  portalError: string | null;
  refreshPortal: () => void;
  notifications: PortalNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  documents: PortalDocument[];
  profile: PatientProfile;
  updateProfile: (next: PatientProfile) => void;
  savingProfile: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Mapping database records onto the portal UI shapes                  */
/* ------------------------------------------------------------------ */

const DOCUMENT_CATEGORIES: Record<string, PortalDocument["category"]> = {
  "Medical Report": "Medical",
  Prescription: "Medical",
  "Laboratory Result": "Medical",
  "Imaging Report": "Medical",
  "Identification Document": "Identity",
  "Government ID": "Identity",
  Picture: "Supporting",
  Video: "Supporting",
  "Referral Letter": "Treatment",
  Other: "Supporting",
};

const shortDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const relativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return shortDate(value);
};

const fileMeta = (mime: string | null, bytes: number | null) => {
  const kind = mime?.split("/")[1]?.toUpperCase() ?? "FILE";
  if (!bytes) return kind;
  const mb = bytes / 1_048_576;
  return `${kind} · ${mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`}`;
};

function notificationKind(type: string, entity: string | null): NotificationKind {
  const value = `${type} ${entity ?? ""}`.toLowerCase();
  if (value.includes("donat")) return "donation";
  if (value.includes("campaign")) return "campaign";
  if (value.includes("treatment") || value.includes("transfer"))
    return "treatment";
  return "application";
}

const NOTIFICATION_TARGETS: Record<NotificationKind, string> = {
  application: "/portal/application",
  campaign: "/portal/campaign",
  donation: "/portal/campaign",
  treatment: "/portal/treatment",
};

function toNotifications(overview: PortalOverview | null): PortalNotification[] {
  return (overview?.notifications ?? []).map((n) => {
    const kind = notificationKind(n.notificationType, n.relatedEntityType);
    return {
      id: n.id,
      kind,
      title: n.title,
      body: n.message,
      time: relativeTime(n.createdAt),
      read: n.isRead,
      target: NOTIFICATION_TARGETS[kind],
    };
  });
}

function toDocuments(overview: PortalOverview | null): PortalDocument[] {
  return (overview?.documents ?? []).map((d) => ({
    id: d.id,
    name: d.title,
    category: DOCUMENT_CATEGORIES[d.documentType] ?? "Supporting",
    type: fileMeta(d.mimeType, d.fileSizeBytes),
    date: shortDate(d.createdAt),
    status: "Verified",
  }));
}

function toProfile(
  overview: PortalOverview | null,
  current: PatientProfile,
): PatientProfile {
  if (!overview) return current;
  const p = overview.profile;
  const patient = overview.patient;
  return {
    ...current,
    fullName: p?.fullName || patient?.fullName || patient?.displayName || "",
    email: p?.email || patient?.email || overview.email || "",
    phone: p?.phone || patient?.phone || "",
    dateOfBirth: patient?.dateOfBirth ?? current.dateOfBirth,
    gender: patient?.gender ?? current.gender,
    address:
      current.address ||
      [p?.city || patient?.city, p?.state || patient?.state]
        .filter(Boolean)
        .join(", "),
  };
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [flow, setFlow] = useState<FlowState>(initialFlow);
  const [profileDraft, setProfileDraft] = useState<PatientProfile>(emptyProfile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getPortalOverview);
  const saveProfileFn = useServerFn(savePortalProfile);
  const markReadFn = useServerFn(markNotificationRead);
  const markAllReadFn = useServerFn(markAllNotificationsRead);

  /* The portal only queries the database once a patient is signed in. */
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchHospitals = useServerFn(listPartnerHospitals);
  const hospitalsQuery = useQuery({
    queryKey: ["partner-hospitals"],
    queryFn: () => fetchHospitals(),
    enabled: hasSession,
    staleTime: 60_000,
  });
  const partnerHospitals = hospitalsQuery.data ?? [];

  const overviewQuery = useQuery({
    queryKey: ["portal-overview"],
    queryFn: () => fetchOverview({}),
    enabled: hasSession,
  });

  const overview = overviewQuery.data ?? null;

  /* Keep the editable profile in step with the saved record. */
  useEffect(() => {
    if (!overview) return;
    setProfileDraft((prev) => toProfile(overview, prev));
  }, [overview]);

  const refreshPortal = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["portal-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["my-application"] });
  }, [queryClient]);

  const startUpload = useCallback((id: string) => {
    const spec = documentSpecs.find((d) => d.id === id);
    setFlow((prev) => ({
      ...prev,
      uploads: { ...prev.uploads, [id]: { status: "uploading", progress: 0 } },
    }));
    let progress = 0;
    const tick = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(tick);
        setFlow((prev) => ({
          ...prev,
          uploads: {
            ...prev.uploads,
            [id]: {
              status: "uploaded",
              progress: 100,
              fileName: spec?.fileName ?? "document.pdf",
            },
          },
        }));
      } else {
        setFlow((prev) => ({
          ...prev,
          uploads: { ...prev.uploads, [id]: { status: "uploading", progress } },
        }));
      }
    }, 220);
  }, []);

  const updateProfile = useCallback(
    (next: PatientProfile) => {
      setProfileDraft(next);
      if (!hasSession) return;
      const [city, state] = next.address.split(",").map((p) => p.trim());
      setSavingProfile(true);
      void saveProfileFn({
        data: {
          fullName: next.fullName,
          email: next.email,
          phone: next.phone,
          city: city ?? "",
          state: state ?? "",
        },
      })
        .then(() => refreshPortal())
        .catch((error: unknown) => {
          console.error("[portal] profile save failed", error);
        })
        .finally(() => setSavingProfile(false));
    },
    [hasSession, refreshPortal, saveProfileFn],
  );

  const markRead = useCallback(
    (id: string) => {
      setReadOverrides((prev) => ({ ...prev, [id]: true }));
      void markReadFn({ data: { id } })
        .then(() => refreshPortal())
        .catch((error: unknown) =>
          console.error("[portal] mark read failed", error),
        );
    },
    [markReadFn, refreshPortal],
  );

  const markAllRead = useCallback(() => {
    const all: Record<string, boolean> = {};
    for (const n of overview?.notifications ?? []) all[n.id] = true;
    setReadOverrides(all);
    void markAllReadFn({})
      .then(() => refreshPortal())
      .catch((error: unknown) =>
        console.error("[portal] mark all read failed", error),
      );
  }, [markAllReadFn, overview, refreshPortal]);

  const value = useMemo<PortalContextValue>(() => {
    const requiredSpecs = documentSpecs.filter((d) => d.required);
    const missingRequired = requiredSpecs.filter(
      (d) => flow.uploads[d.id]?.status !== "uploaded",
    );
    const notifications = toNotifications(overview).map((n) =>
      readOverrides[n.id] ? { ...n, read: true } : n,
    );
    return {
      flow,
      setLocation: (country, state) =>
        setFlow((prev) => ({ ...prev, country, state })),
      setHospital: (id) => setFlow((prev) => ({ ...prev, hospitalId: id })),
      setAnswer: (index, value) =>
        setFlow((prev) => {
          const answers = [...prev.answers];
          answers[index] = value;
          return { ...prev, answers };
        }),
      setStory: (story) => setFlow((prev) => ({ ...prev, story })),
      setCampaign: (patch) => setFlow((prev) => ({ ...prev, ...patch })),
      startUpload,
      removeUpload: (id) =>
        setFlow((prev) => ({
          ...prev,
          uploads: { ...prev.uploads, [id]: { status: "empty", progress: 0 } },
        })),
      markSubmitted: () => setFlow((prev) => ({ ...prev, submitted: true })),
      resetFlow: () => setFlow({ ...initialFlow, uploads: emptyUploads() }),
      prefillSavedApplication: () =>
        setFlow({
          country: "Nigeria",
          state: overview?.patient?.state ?? "Abuja",
          hospitalId: null,
          answers: [...savedAnswers],
          story: buildStory(savedAnswers, profileDraft.fullName),
          campaignTitle: "",
          summary: "",
          uploads: emptyUploads(),
          submitted: false,
        }),
      requiredUploaded: requiredSpecs.length - missingRequired.length,
      requiredTotal: requiredSpecs.length,
      missingRequired,
      partnerHospitals,
      hospitalsLoading: hasSession && hospitalsQuery.isPending,
      hospitalsError: hospitalsQuery.error
        ? "We could not load hospitals right now."
        : null,
      hospitalName:
        partnerHospitals.find((h) => h.id === flow.hospitalId)?.name ??
        overview?.application?.hospitalName ??
        overview?.patient?.hospitalName ??
        "Your hospital",
      portal: overview,
      isPortalLoading: hasSession && overviewQuery.isPending,
      portalError: overviewQuery.error
        ? overviewQuery.error instanceof Error
          ? overviewQuery.error.message
          : "We could not load your information right now."
        : null,
      refreshPortal,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      markRead,
      markAllRead,
      documents: toDocuments(overview),
      profile: profileDraft,
      updateProfile,
      savingProfile,
      sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((v) => !v),
    };
  }, [
    flow,
    overview,
    overviewQuery.isPending,
    overviewQuery.error,
    hasSession,
    readOverrides,
    profileDraft,
    savingProfile,
    sidebarCollapsed,
    startUpload,
    updateProfile,
    markRead,
    markAllRead,
    refreshPortal,
  ]);

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}

export const naira = (value: number) => `₦${value.toLocaleString("en-NG")}`;

