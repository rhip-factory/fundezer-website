CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_hospital_member(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.is_admin(uuid) SET SCHEMA private;
ALTER FUNCTION public.has_hospital_role(uuid, uuid, public.app_role[]) SET SCHEMA private;
ALTER FUNCTION public.owns_patient(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.hospital_can_access_patient(uuid, uuid, public.app_role[]) SET SCHEMA private;
ALTER FUNCTION public.get_public_campaigns() SET SCHEMA private;
ALTER FUNCTION public.get_public_campaign_updates() SET SCHEMA private;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role), private.is_hospital_member(uuid, uuid), private.is_admin(uuid), private.has_hospital_role(uuid, uuid, public.app_role[]), private.owns_patient(uuid, uuid), private.hospital_can_access_patient(uuid, uuid, public.app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_public_campaigns(), private.get_public_campaign_updates() TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.public_campaigns
WITH (security_invoker = true, security_barrier = true)
AS SELECT id, slug, public_title, public_story, public_image_url,
          target::numeric(14,2) AS target, cause_id, hospital_id, status,
          published_at, created_at, updated_at
   FROM private.get_public_campaigns();

CREATE OR REPLACE VIEW public.public_campaign_updates
WITH (security_invoker = true, security_barrier = true)
AS SELECT id, campaign_id, title, content, published_at, created_at, updated_at
   FROM private.get_public_campaign_updates();

GRANT SELECT ON public.public_campaigns, public.public_campaign_updates TO anon, authenticated, service_role;