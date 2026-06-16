# TABEEB — Application Overview

This document summarises the TABEEB project (source: `FA25CS20-Tabeeb-Fixed.docx` and repository), describing the application purpose, major user flows, architecture, implementation details, technology stack, testing approach, deployment, and recommendations.

## 1. Project Summary

- Name: TABEEB
- Purpose: A unified Progressive Web App (PWA) and backend platform to connect patients and verified doctors for appointment booking, secure video consultation, digital prescriptions, medical record management, and AI-assisted features such as report interpretation and medicine alternatives.
- Users: Patients, Doctors, Administrators, and System (automated services).

## 2. Key Features

- User registration and role-based access (Patient, Doctor, Admin).
- Doctor discovery and filtering (specialty, availability, location).
- Appointment booking, time-slot generation (on-demand), and calendar management.
- Real-time video consultations (self-hosted WebRTC/Jitsi solution).
- Upload, store, and share medical records (Cloudinary + MongoDB metadata).
- Digital prescriptions with download/PDF support.
- AI modules: medical report summarization, conversational health assistant, medication alternative recommendations (ML server integration).
- Admin dashboard: doctor verification, user management, content moderation, operational tasks.
- PWA support for offline caching and mobile installability.

## 3. Primary User Flows

- Patient flow: register → search doctors → select time slot → book appointment → upload/share reports → join video consult → receive prescription → schedule follow-up.
- Doctor flow: register → submit license → get verified by admin → publish availability → accept/reject appointments → join consult → issue prescription.
- Admin flow: authenticate → verify doctor credentials → manage users/content → review reports/complaints.

## 4. Architecture (High-level)

- Presentation Layer: `TabeebFrontend` (Next.js + Tailwind CSS + Redux Toolkit + TanStack Query). Implements PWA features and UI components.
- Application/API Layer: `TabeebBackend/tabeeb_backend` (Node.js + Express + TypeScript). Handles authentication, business logic, scheduling, prescriptions, and integrations.
- AI/ML Layer: `TabeebBackend/ML_Server` hosts ML integration logic (e.g., `medllama.js`) connecting to LLM services (Ollama/MedLLama).
- Data Layer: MySQL (Prisma ORM) for relational data (users, appointments, prescriptions), MongoDB for document metadata (medical records), Cloudinary for media storage.
- Real-time/Media: Self-hosted Jitsi/WebRTC server for video; JWT for room auth.

## 5. Technology Stack (as implemented)

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Redux Toolkit, TanStack Query, next-pwa.
- Backend: Node.js, Express.js, TypeScript, Prisma ORM, Multer for file uploads, JWT and Firebase Auth integration.
- Databases: MySQL (primary relational), MongoDB (document metadata).
- Media & Storage: Cloudinary (images/docs), Cloud-hosted VMs for Jitsi.
- AI: Ollama / MedLLama integration (ML server code present).
- DevOps/Deployment: Docker + docker-compose, deployment scripts (`build-and-push.ps1`, `start-local.sh`), Nginx configs under `nginx/`.

## 6. Mapping: Document Chapters → Codebase

- Chapter 4 (System Testing): lists test cases TC-FR1..TC-FR23 and testing strategy (unit, integration, acceptance). The repository documents testing approach in `README.md`/project docs but has no large test-suite committed; tests are described as tooling suggestions (Jest, Mocha, Supertest).
- Chapter 5 (Implementation): maps directly to these repo areas:
  - Team & Roles: developers listed in the Word doc match contributions across `TabeebFrontend` and `TabeebBackend` directories.
  - WBS / Gantt: project planning artifacts (figures) are part of documentation only.
  - Tools & Technologies: confirmed in `package.json` files and `next.config.ts`.
  - ML Server: `TabeebBackend/ML_Server/medllama.js` implements AI integration entrypoints.
  - Deployment: `docker-compose.yml`, `start-local.ps1`, and `build-and-push.ps1` reflect described containerized deployment.

## 7. Testing & Quality (summary from Chapter 4 + repo inspection)

- Test cases are detailed in the document for each functional requirement. They cover common user flows and alternate paths.
- The repo includes references to testing tools and fixtures but lacks a committed end-to-end test harness and CI definitions. The document indicates:
  - Frontend: Jest + React Testing Library (recommended).
  - Backend: Mocha + Chai + Supertest with in-memory Prisma snapshots.
- Observations:
  - Test plans in Chapter 4 align with implemented routes and features in the backend.
  - Some items are marked "Not Started" in the document (e.g., live payment capture, SMTP live run, AI full E2E tests).

## 8. Deployment & Environment

- Environment variables and build args are referenced in `build-and-push.ps1` (Firebase keys, Jitsi secrets, etc.).
- `docker-compose.yml` and `docker-compose.prebuilt.yml` support local and prebuilt deployments.
- `nginx/` holds reverse proxy templates and Let's Encrypt helper scripts.
- Quickstart instructions: `QUICKSTART.md` contains steps for setting up credentials (Firebase, Cloudinary) and starting services locally.

## 9. Security & Compliance Notes

- The team uses self-hosted WebRTC to minimize third-party exposure for video streams.
- Sensitive credentials (payment gateway, SMTP) are deliberately not in the repo; they are configured via env variables.
- Recommendations: enable secure secrets management (Vault/Secrets Manager) for production and rotate keys regularly. Ensure proper data encryption at rest for medical records and follow local health-data regulations.

## 10. Known Gaps & Recommendations

1. Payment & SMTP
   - Status: Payment gateway implemented in sandbox; SMTP live delivery pending.
   - Action: Finalize merchant registration, test live payment capture/refund flows, and verify SMTP templates in production.

2. AI E2E & Safety
   - Status: ML server exists, but full E2E validation (LLM outputs, guardrails for medical advice) is pending.
   - Action: Design and run clinical-safety tests, implement response filters and citation-tracking, run user acceptance tests for AI outputs.

3. Tests & CI/CD
   - Status: Testing frameworks mentioned but no CI pipeline observed.
   - Action: Add test suites (unit, integration, e2e) to repository and configure a CI pipeline (GitHub Actions or similar) to run tests on PRs.

4. Document formatting (Chapter 4 alternate paths)
   - Status: Many alternate-path notes in Chapter 4 are hyphen-delimited inside paragraphs rather than as Word list elements; they should be converted to numbered bullets for clarity.
   - Action: Manual correction in Word (safe) or programmatic XML/docx changes (requires careful editing of `word/document.xml` and `word/numbering.xml`). I can perform either with your confirmation.

5. Accessibility & Performance
   - Action: Run Lighthouse audits on PWA pages and check contrast/tap target sizes for accessibility compliance.

## 11. Files & Locations of Interest

- Frontend: `TabeebFrontend/` — main app, components, `next.config.ts`, `package.json`.
- Backend: `TabeebBackend/tabeeb_backend/` — `src/`, `controllers/`, `services/`, `prisma/`, `package.json`, `Dockerfile`.
- ML Server: `TabeebBackend/ML_Server/medllama.js` and `package.json`.
- Deployment: `docker-compose.yml`, `start-local.sh`, `start-local.ps1`, `build-and-push.ps1`, `nginx/`.
- Document: `FA25CS20-Tabeeb-Fixed.docx` (project report), `FA25CS20-Tabeeb-Fixed.txt` (extracted text).

## 12. How to get the updated Word document (if needed)

If you want the Chapter 4 alternate-path bullets converted to numbered items in the `.docx`, choose one of the options below and I will proceed:

- Manual edit (I provide a checklist of paragraphs and exact changes; you apply them in Word). — safest to preserve styling.
- Automated via `python-docx` (I run a script to split paragraphs and insert numbered paragraphs). — quicker but may slightly alter styles.
- Automated XML editing (direct `word/document.xml` + `word/numbering.xml` modifications). — most exact for numbered lists but riskier; I will take a backup first.

## 13. Contact & Next Steps

Tell me which option you prefer for converting Chapter 4 bullets (manual checklist / python-docx / XML edit), and I'll implement it and provide the updated Word file at the repo root as `FA25CS20-Tabeeb-Fixed-updated.docx`.

---

Generated by reviewing the repository and the extracted project report (Chapters 4 and 5). If you want any section expanded or formatted differently, tell me which parts to focus on.