-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('patient','donor','hospital_reviewer','doctor','hospital_finance','platform_administrator','fraud_analyst','auditor');
CREATE TYPE public.account_status AS ENUM ('active','inactive','suspended');
CREATE TYPE public.verification_status AS ENUM ('Verified','Pending','Suspended');
CREATE TYPE public.capability_status AS ENUM ('Available','Temporarily Unavailable','Not Available');
CREATE TYPE public.patient_status AS ENUM ('Active','Under Treatment','Transferred','Recovered','Closed');
CREATE TYPE public.cause_status AS ENUM ('Active','Inactive');
CREATE TYPE public.campaign_status AS ENUM ('Draft','Under Review','Active','Completed','Suspended');
CREATE TYPE public.application_status AS ENUM ('Submitted','Under Review','Information Requested','Verified','Approved','Rejected','Withdrawn');
CREATE TYPE public.donation_type AS ENUM ('Patient','Cause','Recurring');
CREATE TYPE public.payment_status AS ENUM ('Paid','Pending','Failed','Refunded');
CREATE TYPE public.allocation_status AS ENUM ('Allocated','Under Review','Held','Reversed');
CREATE TYPE public.recurring_frequency AS ENUM ('Weekly','Monthly','Quarterly','Yearly');
CREATE TYPE public.recurring_status AS ENUM ('Active','Paused','Cancelled');
CREATE TYPE public.transfer_status AS ENUM ('Submitted','Under Review','Receiving Hospital Pending','Accepted','Patient Notified','Transfer Scheduled','Treatment Commenced','Completed','Rejected','Cancelled');
CREATE TYPE public.urgency_level AS ENUM ('Low','Medium','High','Critical');
CREATE TYPE public.treatment_stage AS ENUM ('Diagnosis','Treatment Planning','Funding','Admission','Treatment','Post-Treatment','Recovery','Discharged');
CREATE TYPE public.stage_status AS ENUM ('Pending','In Progress','Completed','Skipped');
CREATE TYPE public.publication_status AS ENUM ('Draft','Pending Approval','Approved','Published','Rejected');
CREATE TYPE public.consent_type AS ENUM ('Campaign Publication Consent','Photo Consent','Treatment Update Consent','Story Consent','Contact Consent');
CREATE TYPE public.consent_status AS ENUM ('Granted','Declined','Withdrawn','Pending');
CREATE TYPE public.document_type AS ENUM ('Medical Report','Prescription','Laboratory Result','Imaging Report','Identification Document','Picture','Government ID','Video','Referral Letter','Other');

-- ============ SHARED TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES / ROLES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  status public.account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============ SERVICES ============
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO authenticated, anon;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.services (code, name) VALUES
  ('dialysis','Dialysis'),('oncology','Oncology'),('cardiac_surgery','Cardiac Surgery'),
  ('neurosurgery','Neurosurgery'),('orthopedics','Orthopedics'),('maternal_care','Maternal Care'),
  ('pediatrics','Pediatrics'),('icu','Intensive Care'),('radiotherapy','Radiotherapy'),
  ('transplant','Transplant'),('ophthalmology','Ophthalmology'),('general_surgery','General Surgery');

-- ============ HOSPITALS ============
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  contact_role TEXT,
  email TEXT,
  phone TEXT,
  beds INTEGER NOT NULL DEFAULT 0,
  accreditation TEXT,
  verification public.verification_status NOT NULL DEFAULT 'Pending',
  status public.account_status NOT NULL DEFAULT 'active',
  onboarded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospitals TO authenticated;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_hospitals_updated BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_hospitals_status ON public.hospitals(status);
CREATE INDEX idx_hospitals_verification ON public.hospitals(verification);

CREATE TABLE public.hospital_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  job_title TEXT,
  status public.account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospital_users TO authenticated;
GRANT ALL ON public.hospital_users TO service_role;
ALTER TABLE public.hospital_users ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_hospital_users_updated BEFORE UPDATE ON public.hospital_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_hospital_users_user_id ON public.hospital_users(user_id);
CREATE INDEX idx_hospital_users_hospital_id ON public.hospital_users(hospital_id);

CREATE OR REPLACE FUNCTION public.is_hospital_member(_user_id UUID, _hospital_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.hospital_users
    WHERE user_id = _user_id AND hospital_id = _hospital_id AND status = 'active');
$$;

CREATE TABLE public.hospital_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  status public.capability_status NOT NULL DEFAULT 'Not Available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospital_capabilities TO authenticated;
GRANT ALL ON public.hospital_capabilities TO service_role;
ALTER TABLE public.hospital_capabilities ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_hosp_cap_updated BEFORE UPDATE ON public.hospital_capabilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_hosp_cap_service ON public.hospital_capabilities(service_id, status);

CREATE TABLE public.hospital_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  condition TEXT,
  is_operational BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospital_equipment TO authenticated;
GRANT ALL ON public.hospital_equipment TO service_role;
ALTER TABLE public.hospital_equipment ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_hosp_equip_updated BEFORE UPDATE ON public.hospital_equipment FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_hosp_equip_hospital ON public.hospital_equipment(hospital_id);

-- ============ PATIENTS ============
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  reference_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  full_name TEXT,
  date_of_birth DATE,
  age_band TEXT,
  gender TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  condition TEXT,
  medical_summary TEXT,
  urgency public.urgency_level NOT NULL DEFAULT 'Medium',
  current_hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  status public.patient_status NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_hospital ON public.patients(current_hospital_id);
CREATE INDEX idx_patients_status ON public.patients(status);

-- ============ CAUSES ============
CREATE TABLE public.causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  status public.cause_status NOT NULL DEFAULT 'Active',
  funding_target NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.causes TO authenticated;
GRANT SELECT ON public.causes TO anon;
GRANT ALL ON public.causes TO service_role;
ALTER TABLE public.causes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_causes_updated BEFORE UPDATE ON public.causes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_causes_status ON public.causes(status);

-- ============ APPLICATIONS ============
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  cause_id UUID REFERENCES public.causes(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  requested_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.application_status NOT NULL DEFAULT 'Submitted',
  review_notes TEXT,
  reviewed_by UUID,
  verified_by UUID,
  verification_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_applications_patient ON public.applications(patient_id);
CREATE INDEX idx_applications_hospital ON public.applications(hospital_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_submitted ON public.applications(submitted_at DESC);

-- ============ CAMPAIGNS ============
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  cause_id UUID REFERENCES public.causes(id) ON DELETE SET NULL,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  internal_summary TEXT,
  public_title TEXT,
  public_story TEXT,
  public_image_url TEXT,
  target NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.campaign_status NOT NULL DEFAULT 'Draft',
  is_public BOOLEAN NOT NULL DEFAULT false,
  publication_consent_granted BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_public_requires_consent CHECK (is_public = false OR publication_consent_granted = true)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT ON public.campaigns TO anon;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_campaigns_patient ON public.campaigns(patient_id);
CREATE INDEX idx_campaigns_hospital ON public.campaigns(hospital_id);
CREATE INDEX idx_campaigns_cause ON public.campaigns(cause_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_public ON public.campaigns(is_public, status) WHERE is_public = true;
CREATE INDEX idx_campaigns_created ON public.campaigns(created_at DESC);

-- ============ RECURRING PLANS ============
CREATE TABLE public.recurring_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  cause_id UUID REFERENCES public.causes(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  frequency public.recurring_frequency NOT NULL DEFAULT 'Monthly',
  status public.recurring_status NOT NULL DEFAULT 'Active',
  next_run_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recurring_single_target CHECK (NOT (campaign_id IS NOT NULL AND cause_id IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_plans TO authenticated;
GRANT ALL ON public.recurring_plans TO service_role;
ALTER TABLE public.recurring_plans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_recurring_updated BEFORE UPDATE ON public.recurring_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_recurring_donor ON public.recurring_plans(donor_user_id);
CREATE INDEX idx_recurring_status ON public.recurring_plans(status);

-- ============ DONATIONS ============
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_user_id UUID,
  donor_name TEXT,
  donor_email TEXT,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  cause_id UUID REFERENCES public.causes(id) ON DELETE SET NULL,
  recurring_plan_id UUID REFERENCES public.recurring_plans(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  donation_type public.donation_type NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'Pending',
  allocation_status public.allocation_status NOT NULL DEFAULT 'Under Review',
  payment_method TEXT,
  transaction_reference TEXT UNIQUE,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT donations_single_target CHECK (
    (campaign_id IS NOT NULL AND cause_id IS NULL) OR (campaign_id IS NULL AND cause_id IS NOT NULL)
  )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_donations_updated BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_donations_donor ON public.donations(donor_user_id);
CREATE INDEX idx_donations_campaign ON public.donations(campaign_id);
CREATE INDEX idx_donations_cause ON public.donations(cause_id);
CREATE INDEX idx_donations_payment_status ON public.donations(payment_status);
CREATE INDEX idx_donations_created ON public.donations(created_at DESC);

-- ============ TREATMENT ============
CREATE TABLE public.treatment_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  stage public.treatment_stage NOT NULL,
  stage_status public.stage_status NOT NULL DEFAULT 'Pending',
  position INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_journeys TO authenticated;
GRANT ALL ON public.treatment_journeys TO service_role;
ALTER TABLE public.treatment_journeys ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_journey_updated BEFORE UPDATE ON public.treatment_journeys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_journey_patient ON public.treatment_journeys(patient_id);
CREATE INDEX idx_journey_campaign ON public.treatment_journeys(campaign_id);

CREATE TABLE public.treatment_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES public.treatment_journeys(id) ON DELETE SET NULL,
  author_user_id UUID,
  private_notes TEXT,
  public_summary TEXT,
  status public.publication_status NOT NULL DEFAULT 'Draft',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_updates TO authenticated;
GRANT ALL ON public.treatment_updates TO service_role;
ALTER TABLE public.treatment_updates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_treat_upd_updated BEFORE UPDATE ON public.treatment_updates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_treat_upd_patient ON public.treatment_updates(patient_id);
CREATE INDEX idx_treat_upd_status ON public.treatment_updates(status);

-- ============ TRANSFERS ============
CREATE TABLE public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  originating_hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
  receiving_hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  urgency public.urgency_level NOT NULL DEFAULT 'Medium',
  treatment_phase public.treatment_stage,
  status public.transfer_status NOT NULL DEFAULT 'Submitted',
  admin_decision TEXT,
  admin_decision_by UUID,
  admin_decision_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT transfers_distinct_hospitals CHECK (receiving_hospital_id IS NULL OR receiving_hospital_id <> originating_hospital_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfers TO authenticated;
GRANT ALL ON public.transfers TO service_role;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_transfers_updated BEFORE UPDATE ON public.transfers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_transfers_patient ON public.transfers(patient_id);
CREATE INDEX idx_transfers_origin ON public.transfers(originating_hospital_id);
CREATE INDEX idx_transfers_receiving ON public.transfers(receiving_hospital_id);
CREATE INDEX idx_transfers_status ON public.transfers(status);
CREATE INDEX idx_transfers_requested ON public.transfers(requested_at DESC);

CREATE TABLE public.transfer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  status public.transfer_status NOT NULL,
  actor_user_id UUID,
  actor_label TEXT,
  note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.transfer_events TO authenticated;
GRANT ALL ON public.transfer_events TO service_role;
ALTER TABLE public.transfer_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transfer_events_transfer ON public.transfer_events(transfer_id, occurred_at);

-- ============ HOSPITAL HISTORY ============
CREATE TABLE public.patient_hospital_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
  transfer_id UUID REFERENCES public.transfers(id) ON DELETE SET NULL,
  treatment_phase public.treatment_stage,
  reason TEXT,
  started_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ended_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.patient_hospital_history TO authenticated;
GRANT ALL ON public.patient_hospital_history TO service_role;
ALTER TABLE public.patient_hospital_history ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_php_updated BEFORE UPDATE ON public.patient_hospital_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_php_patient ON public.patient_hospital_history(patient_id, started_on DESC);
CREATE INDEX idx_php_hospital ON public.patient_hospital_history(hospital_id);

-- ============ CONSENTS ============
CREATE TABLE public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  consent_type public.consent_type NOT NULL,
  status public.consent_status NOT NULL DEFAULT 'Pending',
  consent_version TEXT NOT NULL DEFAULT 'v1',
  granted_by_user_id UUID,
  granted_by_name TEXT,
  consented_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_consents_updated BEFORE UPDATE ON public.consents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_consents_patient ON public.consents(patient_id);
CREATE INDEX idx_consents_campaign ON public.consents(campaign_id, consent_type);

-- ============ DOCUMENTS ============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type public.document_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  storage_bucket TEXT NOT NULL DEFAULT 'patient-documents',
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  transfer_id UUID REFERENCES public.transfers(id) ON DELETE CASCADE,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_documents_patient ON public.documents(patient_id);
CREATE INDEX idx_documents_application ON public.documents(application_id);
CREATE INDEX idx_documents_campaign ON public.documents(campaign_id);
CREATE INDEX idx_documents_transfer ON public.documents(transfer_id);

-- ============ CAMPAIGN UPDATES ============
CREATE TABLE public.campaign_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  author_user_id UUID,
  title TEXT,
  content TEXT NOT NULL,
  status public.publication_status NOT NULL DEFAULT 'Draft',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_updates TO authenticated;
GRANT SELECT ON public.campaign_updates TO anon;
GRANT ALL ON public.campaign_updates TO service_role;
ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_camp_upd_updated BEFORE UPDATE ON public.campaign_updates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_camp_upd_campaign ON public.campaign_updates(campaign_id, created_at DESC);
CREATE INDEX idx_camp_upd_status ON public.campaign_updates(status);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_user_id, is_read, created_at DESC);

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_label TEXT,
  description TEXT,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_user_id);

-- ============ APP SETTINGS ============
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();