# Medisyn

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_PPFG97nzFPSquabdU5D1qnGEUXKv)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Report Insights API Key

The Report Insights flow (`/report-insights` -> `/api/report-insights/summarize`) uses Google Gemini and requires an API key.

1. Create `.env.local` in the project root if it does not exist.
2. Add one of the following:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
# optional alias supported by the API route
GOOGLE_API_KEY=your_google_api_key_here
```

3. Restart the dev server after changing env vars.

If the key is missing or invalid, the API now returns a clear authentication/config error message.

## BioSentVec Integration

This app now includes a biomedical text similarity endpoint at `/api/biosentvec/analyze` and a UI panel on the AI Insights page.

To enable real BioSentVec inference locally:

1. Download the BioSentVec model from the NCBI repository documentation.
2. Set `BIOSENTVEC_MODEL_PATH` to the local `.bin` model path.
3. Optionally set `BIOSENTVEC_PYTHON` if your Python executable is not available as `python`.
4. Install the Python packages required by `scripts/biosentvec_bridge.py`:

```bash
pip install sent2vec nltk numpy scipy
```

Without the model or Python dependencies, the app still works by falling back to a lightweight token-similarity matcher so the UI remains functional.

## SciSpaCy Integration

This app also includes a biomedical entity extraction endpoint at `/api/scispacy/extract` and a SciSpaCy panel on the AI Insights page.

To enable real SciSpaCy extraction locally:

1. Install the Python packages:

```bash
pip install spacy scispacy
```

2. Install a biomedical model:

```bash
pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz
```

3. Use a Python version below 3.13 for the SciSpaCy runtime. In this workspace, the working runtime uses Python 3.11.

4. Optionally set these environment variables:

- `SCISPACY_PYTHON` for a non-default Python executable.
- `SCISPACY_MODEL` to use a different installed SciSpaCy model. Default: `en_core_sci_sm`.
- `SCISPACY_LINKER_NAME` to enable ontology linking such as `mesh`, `rxnorm`, or `umls`.

The linker can download large resources, especially `umls`, so it is left disabled by default. If SciSpaCy is not installed, or if linker assets are missing, the app falls back to safe rule-based medical term extraction.

## Sentence Transformers Integration

This app includes embedding-based semantic search at `/api/sentence-transformers/search` and a Sentence Transformers panel on the AI Insights page.

To enable the real model locally:

```bash
pip install sentence-transformers torch
```

Optional environment variables:

- `SENTENCE_TRANSFORMERS_PYTHON` for a non-default Python executable.
- `SENTENCE_TRANSFORMERS_MODEL` for a custom embedding model. Default: `all-MiniLM-L6-v2`.

If dependencies are unavailable, the app automatically falls back to the internal token-based semantic matcher.

## Data Collection Layer

Medisyn now includes a public data ingestion layer that can collect raw treatment discussions from:

- Reddit (public JSON endpoints)
- Forum pages (web scraping snippets)
- Blog feeds (RSS)

### Configure Sources

Edit source definitions in [data/real/collection-sources.json](data/real/collection-sources.json).

Supported source types:

- `reddit`
- `rss`
- `web-page`

### Run Collection Pipeline

Start the app, then trigger collection:

```bash
pnpm collect:data
```

This calls `POST /api/data/collect` and stores collected raw records in:

- `data/raw/treatment-discussions-<timestamp>.json`
- `data/raw/latest.json`

It also persists records into SQLite:

- `data/db/medisyn.sqlite`

### Check Collected Raw Data

Use:

- `GET /api/data/raw/latest` to inspect latest collected output
- `GET /api/data/raw/realtime?limit=50` to read latest records directly from DB
- `POST /api/data/collect` to run a new collection cycle

Each run returns per-source success/failure details and item counts.

### Automation

For automated ingestion, schedule this command via cron / Task Scheduler:

```bash
pnpm collect:data
```

The pipeline is idempotent per run and always writes a fresh timestamped raw snapshot plus `latest.json`.

### Realtime Verification Checklist

1. Run `pnpm collect:data`.
2. Open `GET /api/data/collect` response and confirm `database.insertedItems > 0`.
3. Open `GET /api/data/raw/realtime?limit=5` and confirm:
	- `ok: true`
	- `itemCount > 0`
	- `database.latestRun.generatedAt` updates after each collection run.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/vinay11240207/Medisyn" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
