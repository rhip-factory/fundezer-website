CREATE OR REPLACE FUNCTION private.campaign_application_approved(_application_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _application_id IS NULL OR EXISTS (
    SELECT 1 FROM public.applications WHERE id = _application_id AND status = 'Approved'
  )
$$;
GRANT EXECUTE ON FUNCTION private.campaign_application_approved(uuid) TO anon, authenticated;
DROP POLICY IF EXISTS campaigns_public_read ON public.campaigns;
CREATE POLICY campaigns_public_read ON public.campaigns FOR SELECT TO anon, authenticated
USING (is_public = true AND publication_consent_granted = true
  AND status = ANY (ARRAY['Active'::campaign_status,'Completed'::campaign_status])
  AND private.campaign_application_approved(application_id));