# Digital NEWS Chart

A subscription-based web application for NHS wards that digitises the NEWS2 (National Early Warning Score 2) observation chart. Designed to visually replicate the familiar paper-based NEWS chart (Royal College of Physicians, December 2022), the app allows ward staff to record, score, and track patient physiological observations. At the end of each 30-day cycle, per-patient NEWS charts with a summary report are automatically emailed to a designated administrator.

> **Disclaimer:** This application is not a certified medical device. It is intended as an observation tracking and reference tool. Clinical decisions must always follow local trust policies and professional judgement.

---

## What is NEWS2?

The National Early Warning Score 2 is a standardised system used across the NHS to assess acute illness severity. It scores six physiological parameters to produce a total score that triggers defined clinical responses.

---

## Chart Layout (from RCP NEWS2 Paper Chart)

The digital chart replicates the exact structure of the paper NEWS2 observation chart. Each patient has their own chart.

### Patient Header (captured during patient registration)

| Field | Description |
|---|---|
| **Full Name** | Patient's full name |
| **Date of Birth** | Patient's date of birth |
| **Date of Admission** | Date the patient was admitted to the ward |

These fields are entered once when registering the patient in the system and auto-populate on the digital chart.

### Observation Columns

Each observation is recorded in a date/time column (the paper chart has multiple columns across the page). In the digital version, columns are added dynamically as new observations are entered — no fixed limit.

### Parameter Rows (in chart order, top to bottom)

#### A+B — Respirations (breaths/min)
| Range | Score |
|---|---|
| ≥25 | 3 |
| 21–24 | 2 |
| 18–20 | 0 |
| 15–17 | 0 |
| 12–14 | 0 |
| 9–11 | 1 |
| ≤8 | 3 |

#### A+B — SpO2 Scale 1: Oxygen Saturation (%)
| Range | Score |
|---|---|
| ≥96 | 0 |
| 94–95 | 1 |
| 92–93 | 2 |
| ≤91 | 3 |

#### SpO2 Scale 2: Oxygen Saturation (%) — for hypercapnic respiratory failure (target 88–92%)
Only used under the direction of a qualified clinician.

| Range | Score |
|---|---|
| ≥97 on O2 | 3 |
| 95–96 on O2 | 2 |
| 93–94 on O2 | 1 |
| ≥93 on air | 0 |
| 88–92 | 0 |
| 86–87 | 1 |
| 84–85 | 2 |
| ≤83% | 3 |

#### A+B — Air or Oxygen?
| Value | Score |
|---|---|
| Air (A) | 0 |
| Supplemental O2 | 2 |

Additional fields: **O2 L/min** and **Device** (recorded but not scored).

#### C — Blood Pressure (mmHg, systolic only)
| Range | Score |
|---|---|
| ≥220 | 3 |
| 201–219 | 0 |
| 181–200 | 0 |
| 161–180 | 0 |
| 141–160 | 0 |
| 121–140 | 0 |
| 111–120 | 0 |
| 101–110 | 1 |
| 91–100 | 2 |
| 81–90 | 3 |
| 71–80 | 3 |
| 61–70 | 3 |
| 51–60 | 3 |
| ≤50 | 3 |

#### C — Pulse (beats/min)
| Range | Score |
|---|---|
| ≥131 | 3 |
| 121–130 | 2 |
| 111–120 | 2 |
| 101–110 | 1 |
| 91–100 | 1 |
| 81–90 | 0 |
| 71–80 | 0 |
| 61–70 | 0 |
| 51–60 | 0 |
| 41–50 | 1 |
| 31–40 | 3 |
| ≤30 | 3 |

#### D — Consciousness
Score for NEW onset of confusion (no score if chronic).

| Level | Score |
|---|---|
| Alert | 0 |
| Confusion | 3 |
| Voice (V) | 3 |
| Pain (P) | 3 |
| Unresponsive (U) | 3 |

#### E — Temperature (°C)
| Range | Score |
|---|---|
| ≥39.1° | 2 |
| 38.1–39.0° | 1 |
| 37.1–38.0° | 0 |
| 36.1–37.0° | 0 |
| 35.1–36.0° | 1 |
| ≤35.0° | 3 |

### Chart Footer (per observation column)

| Field | Description |
|---|---|
| **NEWS TOTAL** | Sum of all parameter scores for that observation |
| **Monitoring frequency** | How often observations should be taken |
| **Escalation of care Y/N** | Whether escalation was triggered |
| **Initials** | Initials/name of the clinician who recorded the observation |

### NEWS Score Key (colour-coded)

| Score | Colour |
|---|---|
| 0 | White |
| 1 | Yellow |
| 2 | Orange |
| 3 | Red |

### Clinical Response Thresholds

| Total NEWS2 Score | Risk Level | Clinical Response |
|---|---|---|
| 0 | Low | Routine monitoring (minimum 12-hourly) |
| 1–4 | Low | Increase monitoring frequency (minimum 4–6 hourly) |
| 3 (single parameter) | Low–Medium | Urgent review by clinician competent in acute illness |
| 5–6 | Medium | Urgent response — clinician with acute illness competencies |
| 7+ | High | Emergency response — critical care outreach / team |

---

## How It Works

1. **Ward signs up** — an NHS ward subscribes and receives ward-level login credentials
2. **Register patients** — clinicians register a patient by entering their full name, date of birth, and date of admission (this creates their digital NEWS chart)
3. **Record observations** — clinicians select a patient, enter their own name, and input physiological observations (a new date/time column is added to the chart)
4. **Automatic scoring** — the app calculates the NEWS2 score in real-time, colour-coding the chart cells exactly like the paper version (white/yellow/orange/red)
5. **Ongoing tracking** — observations accumulate on the patient's chart, scrollable horizontally with no column limit (unlike the paper chart)
6. **30-day cycle** — at the end of each 30-day period, per-patient NEWS chart PDFs plus a ward summary are automatically emailed to the designated admin email address

---

## Features (Planned)

### Dashboard (Home Screen)
The dashboard is the main screen after login. It displays:

- **Patient list** — a table/list of all registered patients on the ward
- **Record button** — each patient row has a clearly visible button (e.g. "Record Obs") beside it to start recording an observation immediately
- **At-a-glance info** — latest NEWS2 score, risk level colour indicator, and time since last observation shown per patient
- **Add patient** — button to register a new patient (name, DOB, admission date)

### Observation Entry (Record Flow)
Clicking the "Record Obs" button beside a patient opens the observation entry form:

- **All inputs visible at once** — no multi-step wizard or hidden sections; every parameter is visible on the same screen as simple input boxes
- **Next button per field** — each input box has a "Next" button that moves focus to the next input, allowing quick keyboard-free navigation (useful on tablets/bedside devices)
- **Input order** (top to bottom, matching the paper chart):
  1. Respiration rate (number input)
  2. SpO2 % (number input + Scale 1/2 toggle)
  3. Air or Oxygen (toggle: Air / O2, with L/min and Device fields if O2)
  4. Systolic blood pressure (number input)
  5. Pulse (number input)
  6. Consciousness (select: Alert / Confusion / Voice / Pain / Unresponsive)
  7. Temperature (number input)
- **Declined button** — a red "Declined" button at the bottom-left of the form; records the observation slot as declined by the patient
- **Staff name** — pre-filled from login session, editable if a different clinician is recording
- **Live score preview** — NEWS2 total and colour-coded per-parameter scores update as values are entered
- **Submit** — saves the observation, returns to the dashboard with the updated score visible

### Chart View
- **Visual chart grid** — colour-coded bands (white/yellow/orange/red) matching the exact RCP NEWS2 paper layout
- **Declined column** — when a patient declines observations, the chart shows a red vertical line through the entire column with "DECLINED" written sideways (rotated text), clearly distinguishing it from missing data
- **Unlimited observation columns** — digital advantage over the paper chart's fixed columns; scrollable horizontally
- **SpO2 Scale toggle** — switch between Scale 1 and Scale 2 per patient (for hypercapnic respiratory failure)
- **Patient header** — auto-populated from registration (name, DOB, admission date)

### Authentication & Access
- **Ward-level login** — one set of credentials per ward (shared access)
- **Staff name capture** — each observation records the clinician's name (audit trail)
- **Admin email configuration** — ward admin sets the email address for 30-day reports

### Reporting
- **30-day automated reports** — per-patient NEWS chart PDFs emailed to the admin
- **Ward summary** — aggregated overview appended to the report (total observations, score distributions, escalation events)
- **Print-friendly view** — on-demand paper-like output of any patient's chart

### Subscription & Billing
- **Subscription management** — ward-level subscription with payment processing
- **Tiered pricing** — TBD (per ward, per trust, usage-based)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18+ with TypeScript |
| **Build Tool** | Vite |
| **Styling** | TBD (CSS Modules or Tailwind CSS) |
| **Backend** | TBD (Node.js/Express or Next.js API routes) |
| **Database** | TBD (PostgreSQL likely — NHS-compatible, robust) |
| **Authentication** | TBD (session-based or JWT) |
| **Email Service** | TBD (SendGrid, AWS SES, or NHS Mail integration) |
| **PDF Generation** | TBD (Puppeteer, jsPDF, or React-PDF) |
| **Payments** | TBD (Stripe or NHS-compatible payment provider) |
| **Hosting** | TBD (Azure UK / AWS UK — to be decided closer to deployment) |

---

## Data Storage & NHS Security

This app will handle patient-identifiable data and must comply with NHS information governance standards:

- **Encryption at rest** — all patient data encrypted in the database
- **Encryption in transit** — TLS/HTTPS enforced for all connections
- **UK-only hosting** — data stored exclusively in UK data centres
- **Access controls** — ward-level authentication with staff name audit trail
- **Data retention** — configurable retention periods; data can be purged after report delivery per trust policy
- **Automated reports** — 30-day charts emailed securely, then raw data retention is configurable
- **Audit logging** — all data access and modifications logged

### Compliance Considerations

| Standard | Relevance |
|---|---|
| **DSPT** (Data Security and Protection Toolkit) | Required for any system processing NHS patient data |
| **DCB0129** (Clinical Risk Management) | Applies if the tool influences clinical decisions |
| **DTAC** (Digital Technology Assessment Criteria) | NHS digital health assessment framework |
| **UK GDPR / Data Protection Act 2018** | Patient data is special category data |
| **NHS Cloud Security Guidance** | If hosted on cloud infrastructure |

---

## Getting Started (Development)

```bash
# Clone the repository
git clone <repo-url>
cd digital-news-chart

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure (Planned)

```
src/
├── components/
│   ├── Chart/             # NEWS chart grid — colour-coded rows and observation columns
│   ├── EntryForm/         # Observation input form (all 7 parameters + metadata)
│   ├── PatientRegister/   # Patient registration (name, DOB, admission date)
│   ├── PatientList/       # Patient selection within a ward
│   ├── ScoreDisplay/      # NEWS2 total score and clinical response indicator
│   ├── Dashboard/         # Ward overview and recent activity
│   └── Auth/              # Ward login
├── hooks/                 # Custom React hooks
├── lib/
│   ├── scoring.ts         # NEWS2 scoring logic (all parameter bands)
│   ├── api.ts             # API client
│   └── pdf.ts             # PDF generation for chart reports
├── types/                 # TypeScript type definitions
├── App.tsx
└── main.tsx

server/                    # Backend (TBD)
├── routes/                # API endpoints
├── models/                # Database models (wards, patients, observations)
├── services/
│   ├── email.ts           # 30-day report email service (cron-based)
│   └── pdf.ts             # Server-side PDF generation
└── middleware/             # Auth, logging, validation
```

---

## Reference

Chart layout based on: **National Early Warning Score 2 (NEWS2)** — Royal College of Physicians, December 2022.

---

## Licence

TBD
