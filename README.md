# AI Knowledge Inbox — Frontend

A minimal web interface for saving notes and web pages, asking questions about saved knowledge, and reviewing answers with source excerpts.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Markdown
- Lucide React

## Features

- Switch between website and note ingestion.
- Save content through the backend API.
- Ask natural-language questions about saved knowledge.
- Display generated answers with Markdown formatting.
- Show retrieved source excerpts and similarity scores.
- Browse previously saved knowledge items.
- Display loading, success, error, and empty states.

## Prerequisites

- Node.js
- npm
- The AI Knowledge Inbox backend running locally

## Setup

Open the frontend repository root and install dependencies:

```bash
npm install
```

Create a `.env.local` file in the frontend root:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

This variable points the frontend to the backend API. Do not put your Gemini API key in this file.

## Run the Development Server

```bash
npm run dev
```

Open:

http://localhost:3000

Make sure the backend is running separately at `http://127.0.0.1:8000`.

## Connect to the Backend

The frontend communicates with these backend endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check backend availability |
| POST | `/ingest` | Save a note or ingest a URL |
| GET | `/items` | Load saved knowledge items |
| POST | `/query` | Ask a question and retrieve an answer |

The backend repository has its own setup instructions and dependencies.

## Project Structure

The application uses the Next.js App Router and keeps the main interface in the `src/app` directory.

```text
frontend/
├── src/
│   └── app/
│       ├── page.tsx
│       ├── layout.tsx
│       └── globals.css
├── public/
├── .env.local
├── package.json
└── README.md
```

Your exact structure may vary depending on the options selected when creating the Next.js project.

## Troubleshooting

**Unable to connect to the backend:** Start the backend and verify that `NEXT_PUBLIC_API_BASE_URL` points to the correct address.

**Changes to environment variables are not applied:** Restart the Next.js development server after changing `.env.local`.

**CORS errors:** Ensure the backend permits requests from `http://localhost:3000`.

**Markdown does not render:** Confirm that `react-markdown` is installed and used to render the answer.

**No sources appear:** The backend may not have found sufficiently relevant content for the question.

## Notes

The frontend and backend are maintained as separate repositories. Start each application independently during local development.

The frontend handles presentation and user interaction. API requests, ingestion, embedding generation, retrieval, and answer generation are handled by the backend.# turium-frontend
