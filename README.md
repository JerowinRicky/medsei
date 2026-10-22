# Medsei - Production-Grade HMS-Integrated Discharge Summary Platform

## System Architecture

Medsei is a secure, multi-tenant enterprise healthcare application that unifies clinical data streams from Hospital Management Systems (HMS) and patient documents (via OCR and deterministic AI extraction) to orchestrate verifiable discharge summaries.

### Active Service Ports
- **Frontend Web UI**: `http://localhost:3001` (React 18 + TypeScript + Vite + Tailwind)
- **Primary Backend API**: `http://localhost:5000` (Node.js + Express + Prisma ORM + PostgreSQL 18)
- **AI / Document OCR Microservice**: `http://localhost:8000` (Python 3.13 + FastAPI + PDFPlumber + Tesseract)

---

## Default Access Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@amvionhealth.org` | `Admin@123456` | Full organization, RBAC, HMS gateways, templates, settings |
| **Attending Doctor** | `dr.kumar@amvionhealth.org` | `Admin@123456` | Clinical reviews, task approvals, summaries |

---

## Three Data Ingestion Channels
1. **Option 1: HMS**
   Direct patient search and structured sync via the configured HMS gateway.
2. **Option 2: Document Upload**
   Upload patient discharge notes, prescriptions, and lab reports with OCR and structured AI extraction.
3. **Option 3: HMS + Document Upload**
   Unified clinical model with automatic precedence resolution and conflict detection between HMS records and uploaded documents.

---

## 8-Tab Task Inspection Interface
1. **Patient**: Demographics, UHID, contact, and source provenance.
2. **HMS Data**: Live synchronized structured records and refresh gateway trigger.
3. **Documents**: Clinical file manager with upload, status, and download controls.
4. **OCR / Extraction**: Traceable extracted clinical entities and confidence scores.
5. **Clinical Data**: Conflict resolution screen and verified clinical payload.
6. **Summary**: Dynamic template resolution and revision tracking.
7. **Review & Approval**: Physician sign-off enforcing clinical immutability.
8. **Audit Trail**: Immutable chronological security and compliance log.
