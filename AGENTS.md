<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project architecture

- Public campaign UI reads only through `public_campaigns` and `public_campaign_updates`; these views enforce publication consent and prevent private patient data from reaching the website.
- Keep signed-in navigation grouping in a shared pure helper so header behavior can be tested independently.
- Determine patient dashboard eligibility through patients.user_id and campaigns.patient_id with RLS; public campaign visibility must never imply account ownership.
- Use the shared patient-portal helper for both login entry points and header dashboard access to keep destination and session handoff consistent.

## Deployment

- This app is self-hosted on a Debian server, not on Lovable's hosting. A push to
  `main` triggers `.github/workflows/deploy.yml`, which builds on the server and
  restarts the `fundezer-web` service. Leave that workflow in place.
- The production build MUST be made with `NITRO_PRESET=node-server`. The default
  nitro target here is a Cloudflare Worker bundle, which cannot run under Node.
  Lovable's own sandbox ignores that variable, so its builds are unaffected.
- The server runs Node 24. `@supabase/supabase-js` does not work on Node 20 — it
  emits only a deprecation warning and then fails at request time with HTTP 500.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are needed at runtime as well as at
  build time; the service reads them from `.env` via systemd.
