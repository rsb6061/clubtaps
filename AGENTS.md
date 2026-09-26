# ClubTaps project notes

GitHub + Cloudflare are canonical. Do not reintroduce Floot as a runtime or deployment dependency.

## Invariants
- Preserve existing public URLs and SEO routes.
- Preserve robots.txt, llms.txt, openapi.json and sitemap.xml.
- Never invent private-club dues, initiation fees, availability or access.
- Keep ClubTaps favicon and brand identity.
- ClubTaps is a private-club membership/access directory, not a booking marketplace.
- Public structured API remains available under /_api/public/clubs/*.

## Design
The visual system mirrors SecretNests while ClubTaps content and data semantics remain distinct.
