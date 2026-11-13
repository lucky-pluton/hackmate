# HackMate — A Personalised Hackathon Discovery Platform

> **"Find opportunities that fit the person, not people who have to fit the listings."**

HackMate reverses the traditional, overwhelming hackathon discovery process. Instead of forcing students and developers to sift through hundreds of listings and manually parse dense eligibility rules, registration deadlines, team requirements, and location constraints, HackMate understands the user and recommends verified, tailor-fit opportunities with deterministic precision.

---

## 🌟 Key Features

### 1. Conversational AI Onboarding
- **Progressive Profiling**: Instead of presenting a long, exhausting registration form, an interactive AI onboarding assistant guides new users turn-by-turn.
- **Deep Context Extraction**: Collects educational qualifications, college/university, academic year of study, technical stack, hackathon history, format preferences (Online, Offline, Hybrid), travel willingness, and thematic interests.
- **Confirmation & Review**: Presents an editable profile summary card with confirmation before saving to the database.
- **Celebration**: Celebrates profile completion with celebratory confetti and immediate tailored feed generation.

### 2. Rule-Based Eligibility & Matching Engine
- **Deterministic 4-Tier Categorization**:
  1. `ELIGIBLE`: All mandatory criteria satisfied (age, geographic restrictions, qualification, student/professional status, academic year, team constraints, format, deadline).
  2. `POTENTIALLY ELIGIBLE`: Profile is missing non-blocking information (e.g. unverified age or year of study).
  3. `NEEDS ACTION`: The user is eligible after completing a specific condition (e.g. "This is a team-mandatory event; you must form or join a team of 2-4 members").
  4. `NOT ELIGIBLE`: At least one mandatory criterion failed.
- **Strict Invariant**: *A high preference score NEVER overrides a failed mandatory eligibility requirement.* If an applicant fails a mandatory criterion, the opportunity is strictly marked `NOT ELIGIBLE` and scored appropriately.
- **Transparent Match Breakdown**: Every opportunity displays satisfied requirements, missing requirements, potential blockers, and specific reasons for matching.

### 3. Personal AI Assistant (Powered by Gemini)
- Integrated with the **Gemini API** (`gemini-3.8-flash` via `@google/genai`).
- Context-aware and strictly grounded in the user's active profile and verified opportunity catalog.
- **Zero Hallucination**: Never invents fictional hackathons, deadlines, or registration links.
- Handles natural queries such as:
  - *"Find online AI hackathons I can participate in"*
  - *"Show hackathons open to undergraduate students in India"*
  - *"Find individual participation opportunities"*
  - *"Find competitions closing within seven days"*
  - *"Find hackathons where I can participate without prior experience"*
  - *"Find free hackathons with internship opportunities"*
  - *"Why am I not eligible for Cal Hacks 12.0?"*

### 4. 10 Independent Source Adapters + Structured Feeds
Modular, pluggable architecture supporting independent source sync:
1. **Unstop** (Collegiate engineering challenges & campus hiring hackathons in South Asia)
2. **Devfolio** (Grassroots developer and Web3 hackathons)
3. **Devpost** (Global enterprise and tech giant hackathons)
4. **Major League Hacking (MLH)** (Official student hackathon league and Global Hack Weeks)
5. **Hack2skill** (FinTech, open banking, and university innovation challenges)
6. **HackerEarth** (Enterprise coding sprints and competitive hiring challenges)
7. **DoraHacks** (Open source developer grants and decentralized AI hackathons)
8. **Hack Club** (Teenage and high school builder sprints)
9. **Lablab.ai** (48-hour generative AI and voice assistant sprints)
10. **HackIndia** (Tier-1 and tier-2 grassroots collegiate developer events)
11. **Hackalendar** (Aggregated structured open calendar feeds)

### 5. Cross-Platform Deduplication & Data Ingestion Pipeline
- **Title Normalization**: Strips filler words, dates, and special characters.
- **Token Jaccard & Szymkiewicz–Simpson Overlap**: Recognizes subtitles, expanded names, and cross-platform re-postings.
- **Date Matching**: Corroborates event start dates and registration deadlines.
- **Deterministic Validation**: Verifies URL schemes, date chronology, non-negative fees, and age/team bounds.
- **Admin Review Queue**: Flags listings with low extraction confidence or ambiguous eligibility rules for administrative review.

### 6. Application Tracker & Calendar
- **Kanban-Style Progression**: Track status across `Interested`, `Saved`, `Application started`, `Applied`, `Accepted`, `Rejected`, `Participating`, and `Completed`.
- **Private Notes & Team Details**: Record pitch ideas, teammate contact info, and submission links.
- **Calendar & Reminders**: Chronological agenda view, urgent deadline alerts (< 7 days), one-click Google Calendar template links, and `.ics` iCalendar export downloads.

### 7. Administrative Console
- Health monitoring for all 11 adapters (sync interval, last sync timestamp, status).
- Approval queue for uncertain eligibility criteria or suspicious dates.
- Administrator-controlled manual opportunity importer with live validation.
- Ingestion error logs and diagnostic telemetry.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **AI Engine**: `@google/genai` (Gemini 3.8 Flash) with deterministic local intelligence fallback.
- **Database & Auth**: Supabase (PostgreSQL schema, Row Level Security, Supabase Auth).
- **Persistence**: Hybrid Supabase client with local reactive browser persistence for demoing and offline environments.
- **Testing**: Vitest unit test suite covering eligibility rules, deduplication, and schema validation.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/hackmate.git
cd hackmate
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Optional: Supabase Credentials (leave blank for local reactive demo mode)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Google Gemini API Key (obtain from https://aistudio.google.com/)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# App Mode
VITE_APP_MODE=development
```

> **Note:** If `VITE_SUPABASE_URL` or `VITE_GEMINI_API_KEY` are not set, HackMate automatically runs in an interactive demo mode with persistent local storage and grounded deterministic conversational assistance.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Test Suite
```bash
npm test
```
Executes 13 unit tests covering the Eligibility Engine, Rule Checker, Deduplicator, and Ingestion Validator.

### 5. Production Build
```bash
npm run build
```

---

## 🗄 Database Setup (Supabase)

To deploy HackMate with a live Supabase backend:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the complete migration script provided at:
   `supabase/migrations/20261113000000_init_hackmate.sql`
4. This will set up:
   - `profiles`
   - `user_skills`
   - `user_interests`
   - `user_preferences`
   - `opportunities`
   - `opportunity_sources`
   - `eligibility_criteria`
   - `opportunity_matches`
   - `saved_opportunities`
   - `applications`
   - `notifications`
   - `ingestion_logs`
   - `admin_reviews`
   - Row Level Security (RLS) policies and performance indexes.

---

## 🧪 Testing Coverage

The automated test suite verifies:
- **Eligibility Engine**: Correct classification of `ELIGIBLE`, `POTENTIALLY ELIGIBLE`, `NEEDS ACTION`, and `NOT ELIGIBLE` across geography, education, year of study, student status, age, and team constraints.
- **Mandatory Invariant**: Verified that high preference score never overrides failed mandatory requirements.
- **Cross-Platform Deduplicator**: Token normalization, Jaccard similarity, and Szymkiewicz–Simpson overlap detection.
- **Ingestion Validator**: Strict schema compliance, URL structure, and date chronology.

---

## 📄 License
MIT License. Built for students and developers worldwide.
