# GapFinder AI

A Next.js + TypeScript hackathon prototype for finding knowledge gaps from a learner's own study material.

## What works in this starter

- Demo login (`demo` / `gapfinder2026`) for judge walkthroughs.
- PDF/TXT/MD/CSV text extraction and chunking.
- Topic labels and transparent keyword-based retrieval.
- Diagnostic quiz UI, topic-wise mastery, evidence-backed reasons, and revision plan.
- Topic assistant that returns retrieved excerpts in demo mode.
- Optional Gemini-powered grounded question generation and explanations when `GEMINI_API_KEY` is configured.
- Sample AIML notes and a preloaded demo quiz so the app can be explored immediately.

## Important implementation honesty

The no-key demo mode is a deterministic retrieval prototype, not a live LLM. It uses lexical retrieval rather than vector embeddings. For live RAG, set `GEMINI_API_KEY`; generated responses are grounded in retrieved chunks. This starter does not yet persist documents in a database, use pgvector embeddings, or provide production-grade authentication. The demo login is not secure authentication. Do not use real personal or sensitive documents.

## Prerequisites

- Node.js 20.9+ (Node 22 LTS recommended)
- npm
- Optional Gemini API key

## Run locally

```bash
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY=your_key to .env.local to enable Gemini.
npm run dev
```

Open http://localhost:3000. Sign in with:
- Username: `demo`
- Password: `gapfinder2026`

On Windows PowerShell, copy env file with:
```powershell
Copy-Item .env.example .env.local
```

## Judge walkthrough (3 minutes)

1. Sign in with the demo credentials.
2. Select **Load sample demo** or open Study material and load the sample notes.
3. Open the topic map and generate the quiz.
4. Answer questions, including a few incorrect answers, and submit.
5. Review weak / medium / strong topic ratings and the evidence text.
6. Open Revision plan, adjust daily time and days until exam.
7. Ask the Topic assistant a question and inspect the source list.

## RAG workflow

1. Extract PDF/text content.
2. Split content into approximately 900-character chunks.
3. Retrieve up to four chunks using lexical overlap between a query and chunk tokens.
4. If Gemini is configured, send only the retrieved excerpts plus the task prompt to Gemini Flash.
5. Require the model to answer from those excerpts and cite source labels.
6. Store the generated question's topic, answer key, explanation and source for quiz scoring.

### Current limitations / next production steps

- Add Gemini embedding generation and cosine similarity or Supabase `pgvector` for semantic retrieval.
- Use page-aware PDF extraction and persist document/page metadata.
- Add Supabase Auth, RLS policies, and per-user document storage.
- Persist quiz attempts and revision plans in PostgreSQL; current progress is in React state only.
- Add a human-reviewed topic taxonomy; current topic inference is a lightweight heuristic.
- Improve question validation and reject malformed or unsupported LLM-generated questions.
- Add OCR for scanned PDFs, file-size limits, rate limits and upload security.
- Treat the diagnostic as a learning aid, not a definitive measurement of ability.

## Environment variables

See `.env.example`. Never commit `.env.local` or expose API keys in client-side code.

## Deployment to Vercel

1. Push this repository to GitHub.
2. Import the repository into Vercel.
3. Set `GEMINI_API_KEY` in Vercel Project Settings → Environment Variables (optional but recommended).
4. Deploy, then test upload, quiz generation, citations, and assistant responses on the hosted URL.
5. Keep the demo credentials in the README for judges; replace demo login with real auth before public production use.

## Suggested architecture

```text
Browser (Next.js + TypeScript)
   ├── Material upload ──> /api/upload ──> PDF/text extraction ──> chunking
   ├── Quiz request ─────> /api/diagnose ──> retrieval ──> Gemini (optional) ──> quiz
   ├── Topic question ───> /api/explain ───> retrieval ──> Gemini (optional) ──> cited answer
   └── Quiz responses ───> topic mastery ──> gap report ──> adaptive revision plan
```
