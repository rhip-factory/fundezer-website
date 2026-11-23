-- Public visibility for consented, published campaigns
GRANT SELECT ON public.campaigns TO anon, authenticated;
CREATE POLICY campaigns_public_read ON public.campaigns
  FOR SELECT TO anon, authenticated
  USING (
    is_public = true
    AND publication_consent_granted = true
    AND status IN ('Active'::campaign_status, 'Completed'::campaign_status)
  );

-- Public visibility for published updates of publicly visible campaigns
GRANT SELECT ON public.campaign_updates TO anon, authenticated;
CREATE POLICY campaign_updates_public_read ON public.campaign_updates
  FOR SELECT TO anon, authenticated
  USING (
    status = 'Published'::publication_status
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_updates.campaign_id
        AND c.is_public = true
        AND c.publication_consent_granted = true
        AND c.status IN ('Active'::campaign_status, 'Completed'::campaign_status)
    )
  );

-- Donors may record their own pending donation against exactly one target
GRANT INSERT ON public.donations TO authenticated;
CREATE POLICY donations_own_create ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK (
    donor_user_id = auth.uid()
    AND payment_status = 'Pending'::payment_status
    AND allocation_status = 'Under Review'::allocation_status
    AND (
      (campaign_id IS NOT NULL AND cause_id IS NULL)
      OR (campaign_id IS NULL AND cause_id IS NOT NULL)
    )
    AND amount > 0
  );