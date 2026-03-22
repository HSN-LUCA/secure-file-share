# Future Additions

## 1. Content Moderation — Python AI Microservice

**Status:** Placeholder in place (`lib/moderation/content-scanner.ts`), currently fails open on Vercel.

**Plan:**
- Take the existing Python AI script (detects explicit/harmful images and human presence) and wrap it in a FastAPI microservice
- Deploy the microservice for free on Railway.app, Render.com, or Fly.io
- Update `lib/moderation/content-scanner.ts` to POST the image buffer to the Python API endpoint instead of using nsfwjs
- Add `CONTENT_MODERATION_API_URL` env var to Vercel

**Why deferred:** Vercel does not support Python runtimes. The Python script needs to run as a separate service.

**Files to update when ready:**
- `lib/moderation/content-scanner.ts` — swap nsfwjs logic for a `fetch()` call to the Python API
- `.env.local` / Vercel env vars — add `CONTENT_MODERATION_API_URL`

---

## 2. End-to-End (E2E) Testing

**Status:** Not implemented.

**Plan:**
- Add Playwright or Cypress for E2E test coverage
- Key flows to cover:
  - Upload a file → receive share code → download using share code
  - Upload multiple files → group share code → download individual files
  - Upload blocked image (content moderation)
  - VIP page upload/download flow
  - reCAPTCHA token flow

**Why deferred:** Core functionality and fixes were prioritized first.
