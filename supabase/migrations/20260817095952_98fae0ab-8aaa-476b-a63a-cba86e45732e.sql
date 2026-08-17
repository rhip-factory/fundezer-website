-- Trigger-only functions: never callable via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Unused donor-wall helper: not exposed until needed
REVOKE ALL ON FUNCTION public.campaign_public_donations(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.campaign_public_donations(text) TO service_role;

-- Wallet balance is per signed-in user only
REVOKE ALL ON FUNCTION public.my_wallet_balance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_wallet_balance() TO authenticated, service_role;

-- Public campaign totals stay callable (published campaigns only, aggregate data)
REVOKE ALL ON FUNCTION public.campaign_totals(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.campaign_totals(text) TO anon, authenticated, service_role;