# Digital NEWS Chart — Proposal for Hospital-Hosted Deployment

**Prepared for:** IT / Information Governance
**Prepared by:** [Your name], [role / ward]
**Ask in one sentence:** Host the Digital NEWS Chart system on the hospital's own server so ward staff can log in from any ward PC or tablet and see the same live NEWS2 chart — with all patient data staying inside the hospital, stored encrypted so that even server administrators cannot read it.

---

## What it is

A digital version of the paper NEWS2 observation chart (Royal College of Physicians, 2022 layout). Nurses record physiological observations on a ward tablet or PC; the app scores them automatically and colour-codes the chart exactly like the paper version. It is an observation **recording and charting** tool — it does not monitor patients itself, and clinical decisions remain with staff under local policy.

**Where it stands today:** the app is already built and in use as a standalone tool. All patient data is encrypted on the device itself (AES-256), unlocked by a ward PIN, with an audit trail of who recorded what. It currently sends **nothing** anywhere — no cloud, no third-party services, no analytics.

## What we're proposing

Right now each device keeps its own copy of the chart, so two nurses on two devices can't see the same patient's chart. We'd like to fix that the same way online banking does: the data lives centrally, and every screen is just a window onto it.

- A small service runs on a server **the hospital already owns**, on the hospital network.
- Staff open the chart from any approved ward PC or tablet by logging in with the ward's credentials. Same chart, always up to date, on every screen.
- Tablets keep working if the network drops — they store an encrypted local copy and catch up automatically when reconnected.

## A model you already run — minus the third party

The trust already uses systems like **Oxevision** and **Mobius**, where staff log into a ward dashboard from any screen and the data lives on a central system. This works the same way from staff's point of view. The difference is who is behind the curtain:

| | Vendor-hosted (e.g. Oxevision) | Digital NEWS Chart (this proposal) |
|---|---|---|
| Where the data lives | Vendor-managed infrastructure | The hospital's own server |
| Who can access patient data | Trust staff + vendor engineers under contract | Trust ward staff only — no outside company, and not even server admins (see below) |
| Data-processing contracts needed | Yes | None — no external processor |
| Who controls uptime, backups, access | The vendor | Your IT team, like any system you host |

*(The comparison is about the access model only — Oxevision also performs camera-based monitoring; this tool does not.)*

## Why it's safe — the three key points

1. **Nothing ever leaves the hospital network.** Devices talk to your server over your network. No internet dependency, no cloud, no external company in the patient-data loop.
2. **The server only ever holds a locked box.** Data is encrypted on the ward device *before* it is sent or stored. The key exists only on the ward when staff are logged in. A stolen backup, or a curious administrator, sees scrambled data — not patient names.
3. **You keep full control.** It runs on your hardware; your team can switch it off, back it up, restrict which devices and network segments reach it, and audit it under your existing processes. Every entry records the individual staff member's name.

## What we need from IT

- A small allocation on an existing server (it needs less power than a typical staff PC) and a network address ward devices can reach.
- Your guidance on the trust's approval route for clinical software (IG review, DSPT, DCB0129 clinical safety, DTAC as applicable) — we want to go through the process, not around it. The same assessment categories used for Oxevision-type procurements apply here, with shorter answers.
- (Phase 2, optional) Integration with the trust's existing staff login system (Active Directory / single sign-on) so access is tied to individual staff accounts rather than a ward credential.

## Honest limitations, stated up front

- **Not a certified medical device.** It is an observation-tracking and reference tool; escalation decisions follow local policy and clinical judgement.
- **Encryption cuts both ways.** Because only the ward holds the key, a lost ward credential means IT cannot unscramble the data either. That is a deliberate design choice (it's what makes a breach of the server harmless), and it is mitigated by a documented key-recovery/backup procedure agreed with the ward.
- **Network login needs stronger credentials than a device PIN.** The proposal includes upgrading ward access to a strong passphrase with rate-limiting and lockout — or trust SSO in phase 2.

## Next step

A 30-minute conversation with IT/IG to agree the assessment route and a pilot scope — one ward, running on hospital infrastructure, reviewed on your terms.

**Contact:** [name · email · phone]
