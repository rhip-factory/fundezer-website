-- FundEzer Step 3B: least-privilege database access control

-- Helper functions centralize trusted relationship checks and avoid recursive RLS.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'platform_administrator');
$$;

CREATE OR REPLACE FUNCTION public.has_hospital_role(
  _user_id uuid,
  _hospital_id uuid,
  _roles public.app_role[]
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hospital_users hu
    WHERE hu.user_id = _user_id
      AND hu.hospital_id = _hospital_id
      AND hu.status = 'active'
      AND hu.role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_patient(_user_id uuid, _patient_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = _patient_id AND p.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.hospital_can_access_patient(
  _user_id uuid,
  _patient_id uuid,
  _roles public.app_role[]
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hospital_users hu
    WHERE hu.user_id = _user_id
      AND hu.status = 'active'
      AND hu.role = ANY(_roles)
      AND (
        EXISTS (SELECT 1 FROM public.patients p WHERE p.id = _patient_id AND p.current_hospital_id = hu.hospital_id)
        OR EXISTS (SELECT 1 FROM public.patient_hospital_history phh WHERE phh.patient_id = _patient_id AND phh.hospital_id = hu.hospital_id)
        OR EXISTS (SELECT 1 FROM public.applications a WHERE a.patient_id = _patient_id AND a.hospital_id = hu.hospital_id)
        OR EXISTS (SELECT 1 FROM public.transfers t WHERE t.patient_id = _patient_id AND (t.originating_hospital_id = hu.hospital_id OR t.receiving_hospital_id = hu.hospital_id))
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_hospital_role(uuid, uuid, public.app_role[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_patient(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hospital_can_access_patient(uuid, uuid, public.app_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid), public.has_hospital_role(uuid, uuid, public.app_role[]), public.owns_patient(uuid, uuid), public.hospital_can_access_patient(uuid, uuid, public.app_role[]) TO authenticated, service_role;

-- Existing role helpers must only be callable by authenticated backend identities.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_hospital_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role), public.is_hospital_member(uuid, uuid) TO authenticated, service_role;

-- Safe public projections: never expose campaign patient IDs, internal summaries, approver IDs, or author IDs.
REVOKE SELECT ON public.campaigns FROM anon;
REVOKE SELECT ON public.campaign_updates FROM anon;

CREATE VIEW public.public_campaigns
WITH (security_barrier = true)
AS
SELECT id, slug, public_title, public_story, public_image_url, target, cause_id, hospital_id, status, published_at, created_at, updated_at
FROM public.campaigns
WHERE is_public = true
  AND publication_consent_granted = true
  AND status IN ('Active', 'Completed')
  AND published_at IS NOT NULL;

CREATE VIEW public.public_campaign_updates
WITH (security_barrier = true)
AS
SELECT cu.id, cu.campaign_id, cu.title, cu.content, cu.published_at, cu.created_at, cu.updated_at
FROM public.campaign_updates cu
JOIN public.campaigns c ON c.id = cu.campaign_id
WHERE cu.status = 'Published'
  AND cu.published_at IS NOT NULL
  AND c.is_public = true
  AND c.publication_consent_granted = true
  AND c.status IN ('Active', 'Completed')
  AND c.published_at IS NOT NULL;

REVOKE ALL ON public.public_campaigns, public.public_campaign_updates FROM PUBLIC;
GRANT SELECT ON public.public_campaigns, public.public_campaign_updates TO anon, authenticated, service_role;

-- Profiles and backend-controlled role assignments.
CREATE POLICY profiles_own_read ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY profiles_own_create ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'active');
CREATE POLICY profiles_own_update ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_admin_all ON public.profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
CREATE POLICY user_roles_own_read ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_roles_admin_all ON public.user_roles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Public reference/catalogue data.
CREATE POLICY services_public_active_read ON public.services FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY services_admin_all ON public.services FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY causes_public_active_read ON public.causes FOR SELECT TO anon, authenticated USING (status = 'Active');
CREATE POLICY causes_admin_all ON public.causes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Hospitals and memberships.
CREATE POLICY hospitals_member_read ON public.hospitals FOR SELECT TO authenticated USING (public.is_hospital_member(auth.uid(), id));
CREATE POLICY hospitals_reviewer_update ON public.hospitals FOR UPDATE TO authenticated USING (public.has_hospital_role(auth.uid(), id, ARRAY['hospital_reviewer']::public.app_role[])) WITH CHECK (public.has_hospital_role(auth.uid(), id, ARRAY['hospital_reviewer']::public.app_role[]));
CREATE POLICY hospitals_admin_all ON public.hospitals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY hospital_users_own_read ON public.hospital_users FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY hospital_users_hospital_read ON public.hospital_users FOR SELECT TO authenticated USING (public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer']::public.app_role[]));
CREATE POLICY hospital_users_admin_all ON public.hospital_users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY hospital_capabilities_member_read ON public.hospital_capabilities FOR SELECT TO authenticated USING (public.is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY hospital_capabilities_reviewer_write ON public.hospital_capabilities FOR ALL TO authenticated USING (public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer']::public.app_role[])) WITH CHECK (public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer']::public.app_role[]));
CREATE POLICY hospital_capabilities_admin_all ON public.hospital_capabilities FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY hospital_equipment_member_read ON public.hospital_equipment FOR SELECT TO authenticated USING (public.is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY hospital_equipment_reviewer_write ON public.hospital_equipment FOR ALL TO authenticated USING (public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer']::public.app_role[])) WITH CHECK (public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer']::public.app_role[]));
CREATE POLICY hospital_equipment_admin_all ON public.hospital_equipment FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Patient records and applications.
CREATE POLICY patients_own_read ON public.patients FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY patients_hospital_clinical_read ON public.patients FOR SELECT TO authenticated USING (public.hospital_can_access_patient(auth.uid(), id, ARRAY['hospital_reviewer','doctor']::public.app_role[]));
CREATE POLICY patients_hospital_clinical_update ON public.patients FOR UPDATE TO authenticated USING (public.hospital_can_access_patient(auth.uid(), id, ARRAY['hospital_reviewer','doctor']::public.app_role[])) WITH CHECK (public.hospital_can_access_patient(auth.uid(), id, ARRAY['hospital_reviewer','doctor']::public.app_role[]));
CREATE POLICY patients_reviewer_create ON public.patients FOR INSERT TO authenticated WITH CHECK (current_hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), current_hospital_id, ARRAY['hospital_reviewer']::public.app_role[]));
CREATE POLICY patients_admin_all ON public.patients FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY applications_patient_read ON public.applications FOR SELECT TO authenticated USING (public.owns_patient(auth.uid(), patient_id));
CREATE POLICY applications_patient_create ON public.applications FOR INSERT TO authenticated WITH CHECK (public.owns_patient(auth.uid(), patient_id));
CREATE POLICY applications_hospital_read ON public.applications FOR SELECT TO authenticated USING (hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[]));
CREATE POLICY applications_reviewer_update ON public.applications FOR UPDATE TO authenticated USING (hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer']::public.app_role[])) WITH CHECK (hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer']::public.app_role[]));
CREATE POLICY applications_admin_all ON public.applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Campaign base records remain private to related users; public discovery uses safe views.
CREATE POLICY campaigns_patient_read ON public.campaigns FOR SELECT TO authenticated USING (public.owns_patient(auth.uid(), patient_id));
CREATE POLICY campaigns_hospital_read ON public.campaigns FOR SELECT TO authenticated USING (hospital_id IS NOT NULL AND public.is_hospital_member(auth.uid(), hospital_id));
CREATE POLICY campaigns_admin_all ON public.campaigns FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Donor and finance records.
CREATE POLICY recurring_plans_own_all ON public.recurring_plans FOR ALL TO authenticated USING (donor_user_id = auth.uid()) WITH CHECK (donor_user_id = auth.uid());
CREATE POLICY recurring_plans_fraud_read ON public.recurring_plans FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'fraud_analyst'));
CREATE POLICY recurring_plans_admin_all ON public.recurring_plans FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY donations_own_read ON public.donations FOR SELECT TO authenticated USING (donor_user_id = auth.uid());
CREATE POLICY donations_hospital_finance_read ON public.donations FOR SELECT TO authenticated USING (campaign_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), c.hospital_id, ARRAY['hospital_finance']::public.app_role[])));
CREATE POLICY donations_fraud_read ON public.donations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'fraud_analyst'));
CREATE POLICY donations_admin_all ON public.donations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Treatment journeys and updates.
CREATE POLICY treatment_journeys_patient_read ON public.treatment_journeys FOR SELECT TO authenticated USING (public.owns_patient(auth.uid(), patient_id));
CREATE POLICY treatment_journeys_hospital_read ON public.treatment_journeys FOR SELECT TO authenticated USING (hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[]));
CREATE POLICY treatment_journeys_doctor_write ON public.treatment_journeys FOR ALL TO authenticated USING (hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['doctor']::public.app_role[])) WITH CHECK (hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['doctor']::public.app_role[]));
CREATE POLICY treatment_journeys_admin_all ON public.treatment_journeys FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY treatment_updates_patient_read ON public.treatment_updates FOR SELECT TO authenticated USING (public.owns_patient(auth.uid(), patient_id));
CREATE POLICY treatment_updates_hospital_read ON public.treatment_updates FOR SELECT TO authenticated USING (hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[]));
CREATE POLICY treatment_updates_doctor_create ON public.treatment_updates FOR INSERT TO authenticated WITH CHECK (author_user_id = auth.uid() AND hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['doctor']::public.app_role[]));
CREATE POLICY treatment_updates_doctor_update_draft ON public.treatment_updates FOR UPDATE TO authenticated USING (author_user_id = auth.uid() AND status = 'Draft' AND hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['doctor']::public.app_role[])) WITH CHECK (author_user_id = auth.uid() AND status = 'Draft' AND hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['doctor']::public.app_role[]));
CREATE POLICY treatment_updates_admin_all ON public.treatment_updates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Transfers, append-only timeline, and hospital history.
CREATE POLICY transfers_patient_read ON public.transfers FOR SELECT TO authenticated USING (public.owns_patient(auth.uid(), patient_id));
CREATE POLICY transfers_hospital_read ON public.transfers FOR SELECT TO authenticated USING (public.has_hospital_role(auth.uid(), originating_hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[]) OR (receiving_hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), receiving_hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[])));
CREATE POLICY transfers_reviewer_create ON public.transfers FOR INSERT TO authenticated WITH CHECK (public.has_hospital_role(auth.uid(), originating_hospital_id, ARRAY['hospital_reviewer']::public.app_role[]));
CREATE POLICY transfers_reviewer_update ON public.transfers FOR UPDATE TO authenticated USING (public.has_hospital_role(auth.uid(), originating_hospital_id, ARRAY['hospital_reviewer']::public.app_role[]) OR (receiving_hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), receiving_hospital_id, ARRAY['hospital_reviewer']::public.app_role[]))) WITH CHECK (public.has_hospital_role(auth.uid(), originating_hospital_id, ARRAY['hospital_reviewer']::public.app_role[]) OR (receiving_hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), receiving_hospital_id, ARRAY['hospital_reviewer']::public.app_role[])));
CREATE POLICY transfers_admin_all ON public.transfers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY transfer_events_related_read ON public.transfer_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.transfers t WHERE t.id = transfer_id AND (public.owns_patient(auth.uid(), t.patient_id) OR public.has_hospital_role(auth.uid(), t.originating_hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[]) OR (t.receiving_hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), t.receiving_hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[])))));
CREATE POLICY transfer_events_reviewer_create ON public.transfer_events FOR INSERT TO authenticated WITH CHECK (actor_user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.transfers t WHERE t.id = transfer_id AND (public.has_hospital_role(auth.uid(), t.originating_hospital_id, ARRAY['hospital_reviewer']::public.app_role[]) OR (t.receiving_hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), t.receiving_hospital_id, ARRAY['hospital_reviewer']::public.app_role[])))));
CREATE POLICY transfer_events_admin_read ON public.transfer_events FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY transfer_events_admin_create ON public.transfer_events FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY patient_history_patient_read ON public.patient_hospital_history FOR SELECT TO authenticated USING (public.owns_patient(auth.uid(), patient_id));
CREATE POLICY patient_history_hospital_read ON public.patient_hospital_history FOR SELECT TO authenticated USING (public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[]));
CREATE POLICY patient_history_doctor_write ON public.patient_hospital_history FOR ALL TO authenticated USING (public.has_hospital_role(auth.uid(), hospital_id, ARRAY['doctor']::public.app_role[])) WITH CHECK (public.has_hospital_role(auth.uid(), hospital_id, ARRAY['doctor']::public.app_role[]));
CREATE POLICY patient_history_admin_all ON public.patient_hospital_history FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Consents and document metadata.
CREATE POLICY consents_patient_read ON public.consents FOR SELECT TO authenticated USING (patient_id IS NOT NULL AND public.owns_patient(auth.uid(), patient_id));
CREATE POLICY consents_patient_create ON public.consents FOR INSERT TO authenticated WITH CHECK (patient_id IS NOT NULL AND public.owns_patient(auth.uid(), patient_id) AND granted_by_user_id = auth.uid());
CREATE POLICY consents_patient_update ON public.consents FOR UPDATE TO authenticated USING (patient_id IS NOT NULL AND public.owns_patient(auth.uid(), patient_id)) WITH CHECK (patient_id IS NOT NULL AND public.owns_patient(auth.uid(), patient_id) AND granted_by_user_id = auth.uid());
CREATE POLICY consents_hospital_read ON public.consents FOR SELECT TO authenticated USING (patient_id IS NOT NULL AND public.hospital_can_access_patient(auth.uid(), patient_id, ARRAY['hospital_reviewer','doctor']::public.app_role[]));
CREATE POLICY consents_admin_all ON public.consents FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY documents_patient_read ON public.documents FOR SELECT TO authenticated USING (patient_id IS NOT NULL AND public.owns_patient(auth.uid(), patient_id));
CREATE POLICY documents_hospital_read ON public.documents FOR SELECT TO authenticated USING ((hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[])) OR (patient_id IS NOT NULL AND public.hospital_can_access_patient(auth.uid(), patient_id, ARRAY['hospital_reviewer','doctor']::public.app_role[])));
CREATE POLICY documents_hospital_create ON public.documents FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[]));
CREATE POLICY documents_uploader_delete ON public.documents FOR DELETE TO authenticated USING (uploaded_by = auth.uid());
CREATE POLICY documents_admin_all ON public.documents FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Internal campaign updates; published content is exposed only through the safe view.
CREATE POLICY campaign_updates_patient_read ON public.campaign_updates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND public.owns_patient(auth.uid(), c.patient_id)));
CREATE POLICY campaign_updates_hospital_read ON public.campaign_updates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.hospital_id IS NOT NULL AND public.is_hospital_member(auth.uid(), c.hospital_id)));
CREATE POLICY campaign_updates_hospital_create ON public.campaign_updates FOR INSERT TO authenticated WITH CHECK (author_user_id = auth.uid() AND status = 'Draft' AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.hospital_id IS NOT NULL AND public.has_hospital_role(auth.uid(), c.hospital_id, ARRAY['hospital_reviewer','doctor']::public.app_role[])));
CREATE POLICY campaign_updates_author_update_draft ON public.campaign_updates FOR UPDATE TO authenticated USING (author_user_id = auth.uid() AND status = 'Draft') WITH CHECK (author_user_id = auth.uid() AND status = 'Draft');
CREATE POLICY campaign_updates_admin_all ON public.campaign_updates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Notifications: recipients may read and change only read-state columns.
REVOKE INSERT, UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (is_read, read_at) ON public.notifications TO authenticated;
CREATE POLICY notifications_own_read ON public.notifications FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY notifications_own_update ON public.notifications FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid()) WITH CHECK (recipient_user_id = auth.uid());
CREATE POLICY notifications_admin_read ON public.notifications FOR SELECT TO authenticated USING (public.is_admin());

-- Audit log is append-oriented. Only administrators create entries; administrators and auditors read them.
CREATE POLICY audit_logs_authorized_read ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY audit_logs_admin_create ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND actor_user_id = auth.uid());

-- Platform configuration is administrator-only.
CREATE POLICY app_settings_admin_all ON public.app_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());