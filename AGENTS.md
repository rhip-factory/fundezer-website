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
- Cross-app session handoff opens a new top-level tab rather than navigating this one, and must not pass `noopener` to `window.open` — that makes the call return null even on success, so a blocked popup can no longer be detected and fallen back to.
