-- ============ helper: updated_at ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  update_channels text[] NOT NULL DEFAULT ARRAY['Email']::text[],
  default_donation_visibility text NOT NULL DEFAULT 'public',
  consent_communications boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_visibility_chk CHECK (default_donation_visibility IN ('public','anonymous','private'))
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ campaigns (public-safe only) ============
CREATE TABLE public.campaigns (
  id text PRIMARY KEY,
  public_identity_type text NOT NULL DEFAULT 'first_name_initial',
  public_display_name text NOT NULL,
  age integer,
  condition text NOT NULL,
  category text NOT NULL,
  hospital text NOT NULL,
  location text NOT NULL,
  goal bigint NOT NULL,
  offline_raised bigint NOT NULL DEFAULT 0,
  seed_donors integer NOT NULL DEFAULT 0,
  urgency text NOT NULL DEFAULT 'Urgent',
  days_left integer NOT NULL DEFAULT 30,
  story text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT 'oncology',
  status text NOT NULL DEFAULT 'live',
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_identity_chk CHECK (public_identity_type IN ('first_name','first_name_initial','preferred_name','anonymous','family_name')),
  CONSTRAINT campaigns_status_chk CHECK (status IN ('live','fully_funded','closed'))
);
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published campaigns are public" ON public.campaigns FOR SELECT TO anon, authenticated USING (published = true);
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ campaign private identity (never client-readable) ============
CREATE TABLE public.campaign_private_details (
  campaign_id text PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  legal_full_name text NOT NULL,
  contact_phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.campaign_private_details TO service_role;
ALTER TABLE public.campaign_private_details ENABLE ROW LEVEL SECURITY;

-- ============ consents ============
CREATE TABLE public.campaign_consents (
  campaign_id text PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  consent_publication boolean NOT NULL DEFAULT false,
  consent_photo_use boolean NOT NULL DEFAULT false,
  consent_treatment_updates boolean NOT NULL DEFAULT false,
  consent_story_publication boolean NOT NULL DEFAULT false,
  consent_communications boolean NOT NULL DEFAULT false,
  consented_by text NOT NULL DEFAULT '',
  consented_at timestamptz
);
GRANT SELECT ON public.campaign_consents TO anon;
GRANT SELECT ON public.campaign_consents TO authenticated;
GRANT ALL ON public.campaign_consents TO service_role;
ALTER TABLE public.campaign_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent flags of published campaigns are public" ON public.campaign_consents
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.published));

-- ============ donor-safe treatment updates ============
CREATE TABLE public.campaign_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  hospital text NOT NULL DEFAULT '',
  approved boolean NOT NULL DEFAULT false,
  posted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_updates TO anon;
GRANT SELECT ON public.campaign_updates TO authenticated;
GRANT ALL ON public.campaign_updates TO service_role;
ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved updates are public" ON public.campaign_updates
  FOR SELECT TO anon, authenticated
  USING (approved AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.published));

CREATE TABLE public.campaign_update_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid NOT NULL REFERENCES public.campaign_updates(id) ON DELETE CASCADE,
  clinical_detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.campaign_update_internal_notes TO service_role;
ALTER TABLE public.campaign_update_internal_notes ENABLE ROW LEVEL SECURITY;

-- ============ donor wallets ============
CREATE TABLE public.donor_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'NGN',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donor_wallets TO authenticated;
GRANT ALL ON public.donor_wallets TO service_role;
ALTER TABLE public.donor_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet read" ON public.donor_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.donor_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.donor_wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  direction text NOT NULL,
  amount bigint NOT NULL,
  reference text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  campaign_id text REFERENCES public.campaigns(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dwt_amount_chk CHECK (amount > 0),
  CONSTRAINT dwt_direction_chk CHECK (direction IN ('credit','debit')),
  CONSTRAINT dwt_kind_chk CHECK (kind IN ('topup','donation','refund','adjustment','recurring_topup'))
);
GRANT SELECT ON public.donor_wallet_transactions TO authenticated;
GRANT ALL ON public.donor_wallet_transactions TO service_role;
ALTER TABLE public.donor_wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions read" ON public.donor_wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX donor_wallet_tx_user_idx ON public.donor_wallet_transactions (user_id, created_at DESC);

-- ============ campaign wallets (separate accounting) ============
CREATE TABLE public.campaign_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL UNIQUE REFERENCES public.campaigns(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'NGN',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_wallets TO anon;
GRANT SELECT ON public.campaign_wallets TO authenticated;
GRANT ALL ON public.campaign_wallets TO service_role;
ALTER TABLE public.campaign_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign wallets of published campaigns" ON public.campaign_wallets
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.published));

CREATE TABLE public.campaign_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_wallet_id uuid NOT NULL REFERENCES public.campaign_wallets(id) ON DELETE CASCADE,
  campaign_id text NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  kind text NOT NULL,
  direction text NOT NULL,
  amount bigint NOT NULL,
  reference text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cwt_amount_chk CHECK (amount > 0),
  CONSTRAINT cwt_direction_chk CHECK (direction IN ('credit','debit')),
  CONSTRAINT cwt_kind_chk CHECK (kind IN ('donation','hospital_disbursement','adjustment','refund'))
);
GRANT ALL ON public.campaign_wallet_transactions TO service_role;
ALTER TABLE public.campaign_wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX campaign_wallet_tx_idx ON public.campaign_wallet_transactions (campaign_id, created_at DESC);

-- ============ donations ============
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  donor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  visibility text NOT NULL DEFAULT 'public',
  public_display_name text NOT NULL DEFAULT 'Anonymous donor',
  message text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'wallet',
  reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT donations_visibility_chk CHECK (visibility IN ('public','anonymous','private')),
  CONSTRAINT donations_source_chk CHECK (source IN ('wallet','card','transfer'))
);
GRANT SELECT ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own donations read" ON public.donations FOR SELECT TO authenticated USING (auth.uid() = donor_user_id);
CREATE INDEX donations_campaign_idx ON public.donations (campaign_id, created_at DESC);
CREATE INDEX donations_donor_idx ON public.donations (donor_user_id, created_at DESC);

-- ============ recurring plans ============
CREATE TABLE public.recurring_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount bigint NOT NULL CHECK (amount > 0),
  frequency text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  next_charge_date date NOT NULL DEFAULT (current_date + 30),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recurring_freq_chk CHECK (frequency IN ('weekly','monthly','quarterly')),
  CONSTRAINT recurring_status_chk CHECK (status IN ('active','paused','cancelled'))
);
GRANT SELECT ON public.recurring_plans TO authenticated;
GRANT ALL ON public.recurring_plans TO service_role;
ALTER TABLE public.recurring_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plans read" ON public.recurring_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER recurring_plans_updated_at BEFORE UPDATE ON public.recurring_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ notifications ============
CREATE TABLE public.wallet_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'wallet',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.wallet_notifications TO authenticated;
GRANT ALL ON public.wallet_notifications TO service_role;
ALTER TABLE public.wallet_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.wallet_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications mark read" ON public.wallet_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ audit log (internal only) ============
CREATE TABLE public.wallet_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.wallet_audit_log TO service_role;
ALTER TABLE public.wallet_audit_log ENABLE ROW LEVEL SECURITY;

-- ============ server-side balance / public aggregate functions ============
CREATE OR REPLACE FUNCTION public.my_wallet_balance()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0)::bigint
  FROM public.donor_wallet_transactions WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.my_wallet_balance() FROM public;
GRANT EXECUTE ON FUNCTION public.my_wallet_balance() TO authenticated;

CREATE OR REPLACE FUNCTION public.campaign_totals(_campaign_id text)
RETURNS TABLE (raised bigint, donor_count integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (COALESCE(c.offline_raised,0) + COALESCE((SELECT SUM(d.amount) FROM public.donations d WHERE d.campaign_id = c.id),0))::bigint,
         (c.seed_donors + COALESCE((SELECT COUNT(*) FROM public.donations d WHERE d.campaign_id = c.id),0))::integer
  FROM public.campaigns c WHERE c.id = _campaign_id AND c.published;
$$;
REVOKE ALL ON FUNCTION public.campaign_totals(text) FROM public;
GRANT EXECUTE ON FUNCTION public.campaign_totals(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.campaign_public_donations(_campaign_id text)
RETURNS TABLE (display_name text, amount bigint, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN d.visibility = 'public' THEN d.public_display_name ELSE 'Anonymous donor' END,
         d.amount, d.created_at
  FROM public.donations d
  JOIN public.campaigns c ON c.id = d.campaign_id AND c.published
  WHERE d.campaign_id = _campaign_id AND d.visibility <> 'private'
  ORDER BY d.created_at DESC LIMIT 50;
$$;
REVOKE ALL ON FUNCTION public.campaign_public_donations(text) FROM public;
GRANT EXECUTE ON FUNCTION public.campaign_public_donations(text) TO anon, authenticated;

-- ============ profile bootstrap on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.donor_wallets (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ seed the six demo campaigns ============
INSERT INTO public.campaigns (id, public_identity_type, public_display_name, age, condition, category, hospital, location, goal, offline_raised, seed_donors, urgency, days_left, image, status, published) VALUES
 ('amina-k','first_name_initial','Amina K.',34,'Stage II Breast Cancer','Oncology','Alliance Hospital','Wuse II, Abuja',12000000,7350000,214,'Urgent',21,'oncology','live',true),
 ('tunde-a','first_name_initial','Tunde A.',7,'Congenital Heart Defect','Cardiology','NNPC Multispecialty Hospital','CBD, Abuja',9600000,8940000,388,'Critical',9,'paediatric','live',true),
 ('grace-o','first_name_initial','Grace O.',52,'End-Stage Kidney Disease','Nephrology','Cedarcrest Hospital','Gudu, Abuja',6400000,2180000,96,'Urgent',34,'dialysis','live',true),
 ('ibrahim-s','first_name_initial','Ibrahim S.',29,'Compound Femur Fracture','Orthopaedics','Cedarcrest Hospital','Gudu, Abuja',3800000,1420000,61,'Urgent',27,'orthopaedic','live',true),
 ('halima-b','first_name_initial','Halima B.',26,'Emergency Caesarean & Neonatal Care','Maternal Care','Nisa Premier Hospital','Jabi, Abuja',2900000,2610000,143,'Critical',5,'maternal','live',true),
 ('chidi-e','first_name_initial','Chidi E.',41,'Brain Tumour (Meningioma)','Neurosurgery','Cedarcrest Hospital','Gudu, Abuja',14500000,3150000,88,'Scheduled',46,'neuro','live',true);

INSERT INTO public.campaign_private_details (campaign_id, legal_full_name) VALUES
 ('amina-k','Amina Kabir'),('tunde-a','Tunde Adeyemi'),('grace-o','Grace Okonkwo'),
 ('ibrahim-s','Ibrahim Sule'),('halima-b','Halima Bello'),('chidi-e','Chidi Eze');

INSERT INTO public.campaign_consents (campaign_id, consent_publication, consent_photo_use, consent_treatment_updates, consent_story_publication, consent_communications, consented_by, consented_at)
SELECT id, true, true, true, true, true, 'Patient', now() FROM public.campaigns;

INSERT INTO public.campaign_wallets (campaign_id) SELECT id FROM public.campaigns;

INSERT INTO public.campaign_updates (campaign_id, title, body, hospital, approved, posted_at) VALUES
 ('amina-k','Campaign verified and published','Alliance Hospital approved the treatment plan and cost estimate.','Alliance Hospital',true, now() - interval '20 days'),
 ('amina-k','Treatment has commenced','The hospital has confirmed that treatment has started and care is ongoing.','Alliance Hospital',true, now() - interval '6 days'),
 ('tunde-a','Surgery date provisionally booked','A theatre slot has been reserved and will be confirmed once funding is complete.','NNPC Multispecialty Hospital',true, now() - interval '4 days'),
 ('grace-o','Dialysis sessions ongoing','Funds released cover the current schedule of dialysis sessions.','Cedarcrest Hospital',true, now() - interval '9 days'),
 ('halima-b','Mother and baby stable','Both mother and baby are stable and under observation.','Nisa Premier Hospital',true, now() - interval '2 days');