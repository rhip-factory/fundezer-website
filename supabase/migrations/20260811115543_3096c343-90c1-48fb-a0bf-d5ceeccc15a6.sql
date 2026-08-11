CREATE TABLE public.partner_donor_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  interests TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT INSERT ON public.partner_donor_signups TO anon;
GRANT INSERT ON public.partner_donor_signups TO authenticated;
GRANT ALL ON public.partner_donor_signups TO service_role;
ALTER TABLE public.partner_donor_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a donor signup" ON public.partner_donor_signups FOR INSERT TO anon, authenticated WITH CHECK (true);