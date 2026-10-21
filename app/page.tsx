
"use client";

import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  BookOpen,
  Globe,
  FileText,
  Plus,
  Send,
  LoaderCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Inbox,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type SourceType = "note" | "url";

interface KnowledgeItem {
  id: number;
  source_type: SourceType;
  source_url: string | null;
  content: string;
  created_at: string;
}

interface ItemsResponse {
  items: KnowledgeItem[];
  total: number;
}

interface IngestResponse {
  id: number;
  source_type: SourceType;
  chunks_created: number;
  message: string;
}

interface QuerySource {
  item_id: number;
  source_url: string | null;
  chunk_index: number;
  content: string;
  similarity: number;
}

interface QueryResponse {
  answer: string;
  sources: QuerySource[];
}

interface ApiErrorResponse {
  detail?: string | { msg?: string }[];
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    const detail = errorData.detail;

    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item.msg || "Invalid request").join(", ")
          : "Request failed. Please try again.";

    throw new Error(message);
  }

  return data as T;
}

function getSourceLabel(source: QuerySource): string {
  if (source.source_url) {
    try {
      return new URL(source.source_url).hostname.replace(/^www\./, "");
    } catch {
      return `Webpage #${source.item_id}`;
    }
  }

  return `Saved note #${source.item_id}`;
}

function cleanMarkdown(text: string): string {
  // Convert escaped asterisks into Markdown formatting characters.
  return text.replace(/\\\*/g, "*");
}

export default function Home() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QueryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadItems(): Promise<void> {
    setLoading(true);

    try {
      const result = await apiRequest<ItemsResponse>("/items");
      setItems(result.items ?? []);
      setError("");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not load saved items."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleIngest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload =
        sourceType === "url"
          ? { source_type: "url" as const, url: url.trim() }
          : { source_type: "note" as const, content: note.trim() };

      const result = await apiRequest<IngestResponse>("/ingest", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setNotice(`Saved successfully · ${result.chunks_created} chunks indexed`);
      setUrl("");
      setNote("");
      setAnswer(null);
      await loadItems();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not save your content."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!question.trim()) return;

    setAsking(true);
    setError("");
    setNotice("");
    setAnswer(null);

    try {
      const result = await apiRequest<QueryResponse>("/query", {
        method: "POST",
        body: JSON.stringify({ question: question.trim() }),
      });

      setAnswer(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not answer.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <header className="header">
        <a className="brand" href="/">
          <span className="brand-icon">
            <BookOpen size={20} />
          </span>
          <span>Knowledge Inbox</span>
        </a>

        <button
          className="icon-button"
          type="button"
          onClick={() => void loadItems()}
          aria-label="Refresh saved items"
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
        </button>
      </header>

      {(error || notice) && (
        <div
          className={`notice ${error ? "error" : "success"}`}
          role="status"
        >
          <span>{error || notice}</span>
          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <section className="capture card">
        <div className="section-title">
          <h1>Save something useful.</h1>
          <span className="item-count">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="tabs">
          <button
            type="button"
            className={sourceType === "url" ? "tab active" : "tab"}
            onClick={() => setSourceType("url")}
          >
            <Globe size={16} />
            Website
          </button>

          <button
            type="button"
            className={sourceType === "note" ? "tab active" : "tab"}
            onClick={() => setSourceType("note")}
          >
            <FileText size={16} />
            Note
          </button>
        </div>

        <form onSubmit={handleIngest}>
          {sourceType === "url" ? (
            <input
              className="field"
              type="url"
              placeholder="Paste a webpage URL..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
            />
          ) : (
            <textarea
              className="field note-field"
              placeholder="Write or paste your note..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={100000}
              rows={4}
              required
            />
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={saving || loading}
          >
            {saving ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Plus size={17} />
            )}
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      <section className="ask card">
        <div className="section-title">
          <h2>
            <Sparkles size={18} />
            Ask your knowledge
          </h2>
        </div>

        <form onSubmit={handleAsk} className="question-form">
          <textarea
            className="field question-field"
            placeholder={
              items.length === 0
                ? "Save a note or webpage, then ask a question..."
                : "Ask a question about your saved content..."
            }
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={2}
            maxLength={5000}
            required
          />

          <button
            className="primary-button ask-button"
            type="submit"
            disabled={asking || !question.trim()}
          >
            {asking ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Send size={16} />
            )}
            {asking ? "Thinking..." : "Ask"}
          </button>
        </form>

        {answer && (
          <div className="answer">
            <p className="answer-label">ANSWER</p>

            <div className="markdown-answer">
              <ReactMarkdown>{cleanMarkdown(answer.answer)}</ReactMarkdown>
            </div>

            {answer.sources.length > 0 && (
              <div className="source-list">
                <p className="answer-label">SOURCES</p>

                {answer.sources.map((source, index) => (
                  <article
                    className="source"
                    key={`${source.item_id}-${source.chunk_index}`}
                  >
                    <div className="source-heading">
                      <span>
                        {index + 1}. {getSourceLabel(source)}
                      </span>
                      <span title="Cosine similarity, not answer confidence">
                        Similarity: {source.similarity.toFixed(2)}
                      </span>
                    </div>

                    <p>{source.content}</p>

                    {source.source_url && (
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open page <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}

            {answer.sources.length === 0 && (
              <p className="empty-answer">
                No relevant sources were found in your saved knowledge.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="library">
        <div className="section-title">
          <h2>Saved items</h2>
          <span className="item-count">{items.length}</span>
        </div>

        {loading ? (
          <div
            className="empty"
            style={{
              minHeight: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <LoaderCircle className="spin" size={20} />
            Loading your library...
          </div>
        ) : items.length === 0 ? (
          <div
            className="empty"
            style={{
              minHeight: 210,
              padding: "32px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface, #f3f4f6)",
              }}
            >
              <Inbox size={25} />
            </div>

            <div>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>
                Your library starts here
              </p>
              <p style={{ margin: 0, opacity: 0.7, lineHeight: 1.6 }}>
                Save a webpage or note above. Your content will be searchable
                here, ready for you to ask questions.
              </p>
            </div>
          </div>
        ) : (
          <div className="item-list">
            {items.map((item) => (
              <article className="saved-item" key={item.id}>
                <div className="saved-icon">
                  {item.source_type === "url" ? (
                    <Globe size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                </div>

                <div className="saved-content">
                  <div className="saved-meta">
                    <span>
                      {item.source_type === "url" ? "WEBPAGE" : "NOTE"} · #
                      {item.id}
                    </span>

                    <span>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>

                  <p>{item.content}</p>

                  {item.source_url && (
                    <a
                      className="saved-url"
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.source_url} <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">Your knowledge, searchable.</footer>
    </main>
  );
}
