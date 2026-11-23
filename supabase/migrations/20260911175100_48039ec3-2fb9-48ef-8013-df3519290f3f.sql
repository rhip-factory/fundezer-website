-- Resolve security-definer view findings while preserving a safe public projection.
CREATE OR REPLACE FUNCTION public.get_public_campaigns()
RETURNS TABLE (
  id uuid, slug text, public_title text, public_story text, public_image_url text,
  target numeric(14,2), cause_id uuid, hospital_id uuid, status public.campaign_status,
  published_at timestamptz, created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.slug, c.public_title, c.public_story, c.public_image_url,
         c.target, c.cause_id, c.hospital_id, c.status,
         c.published_at, c.created_at, c.updated_at
  FROM public.campaigns c
  WHERE c.is_public = true
    AND c.publication_consent_granted = true
    AND c.status IN ('Active', 'Completed')
    AND c.published_at IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_public_campaign_updates()
RETURNS TABLE (
  id uuid, campaign_id uuid, title text, content text,
  published_at timestamptz, created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cu.id, cu.campaign_id, cu.title, cu.content,
         cu.published_at, cu.created_at, cu.updated_at
  FROM public.campaign_updates cu
  JOIN public.campaigns c ON c.id = cu.campaign_id
  WHERE cu.status = 'Published'
    AND cu.published_at IS NOT NULL
    AND c.is_public = true
    AND c.publication_consent_granted = true
    AND c.status IN ('Active', 'Completed')
    AND c.published_at IS NOT NULL;
$$;

ALTER VIEW public.public_campaigns SET (security_invoker = true);
ALTER VIEW public.public_campaign_updates SET (security_invoker = true);
CREATE OR REPLACE VIEW public.public_campaigns
WITH (security_invoker = true, security_barrier = true)
AS SELECT id, slug, public_title, public_story, public_image_url,
          target::numeric(14,2) AS target, cause_id, hospital_id, status,
          published_at, created_at, updated_at
   FROM public.get_public_campaigns();
CREATE OR REPLACE VIEW public.public_campaign_updates
WITH (security_invoker = true, security_barrier = true)
AS SELECT * FROM public.get_public_campaign_updates();

REVOKE ALL ON FUNCTION public.get_public_campaigns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_campaign_updates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_campaigns(), public.get_public_campaign_updates() TO anon, authenticated, service_role;
GRANT SELECT ON public.public_campaigns, public.public_campaign_updates TO anon, authenticated, service_role;

-- Internal RLS predicates are authenticated-only and cannot be invoked anonymously.
REVOKE ALL ON FUNCTION public.is_admin(uuid), public.has_hospital_role(uuid, uuid, public.app_role[]), public.owns_patient(uuid, uuid), public.hospital_can_access_patient(uuid, uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role), public.is_hospital_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid), public.has_hospital_role(uuid, uuid, public.app_role[]), public.owns_patient(uuid, uuid), public.hospital_can_access_patient(uuid, uuid, public.app_role[]), public.has_role(uuid, public.app_role), public.is_hospital_member(uuid, uuid) TO authenticated, service_role;

-- Prevent self-service profile edits from changing backend account state or ownership.
CREATE OR REPLACE FUNCTION public.guard_profile_security_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Profile ownership and account status are backend-controlled';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_profile_security_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_profile_security_fields() TO service_role;
CREATE TRIGGER trg_profiles_guard_security BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_security_fields();

-- Prevent hospital staff from reassigning patient identity through a clinical update.
CREATE OR REPLACE FUNCTION public.guard_patient_identity_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.reference_code IS DISTINCT FROM OLD.reference_code THEN
      RAISE EXCEPTION 'Patient identity fields are backend-controlled';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_patient_identity_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_patient_identity_fields() TO service_role;
CREATE TRIGGER trg_patients_guard_identity BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.guard_patient_identity_fields();

-- Append automatic audit entries for the most sensitive administrative changes.
CREATE OR REPLACE FUNCTION public.audit_sensitive_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  row_id uuid;
BEGIN
  row_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  INSERT INTO public.audit_logs (
    actor_user_id, action, entity_type, entity_id, description, previous_state, new_state
  ) VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME, row_id,
    'Security-sensitive administrative change',
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
REVOKE ALL ON FUNCTION public.audit_sensitive_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_sensitive_change() TO service_role;
CREATE TRIGGER trg_user_roles_audit AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();
CREATE TRIGGER trg_app_settings_audit AFTER INSERT OR UPDATE OR DELETE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();