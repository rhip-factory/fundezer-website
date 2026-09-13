GRANT SELECT ON public.public_campaigns TO anon, authenticated;
GRANT SELECT ON public.public_campaign_updates TO anon, authenticated;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_public_campaigns() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_public_campaign_updates() TO anon, authenticated;
GRANT SELECT ON public.causes TO anon;