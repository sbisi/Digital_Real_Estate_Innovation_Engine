// frontend/src/pages/AddConnectPage.jsx
import React, { useState, useRef } from "react";

// Basispfad für die API: VITE_API_BASE_URL (Render) oder Origin (lokal)
const API_BASE_URL = `${(import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, "")}/api`;

// kleine Hilfsfunktion
function parseTags(str) {
  if (!str) return [];
  return str.split(",").map(t => t.trim()).filter(Boolean);
}

export default function AddConnectPage() {
  const [tab, setTab] = useState("manual");

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Add &amp; Connect</h1>
        <p className="text-sm text-gray-500">
          Füge neuen Inhalt manuell hinzu, importiere per URL oder lade eine Datei hoch.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded-md border ${tab === "manual" ? "bg-black text-white" : "bg-white"}`}
          onClick={() => setTab("manual")}
          type="button"
        >
          Manuell
        </button>
        <button
          className={`px-3 py-2 rounded-md border ${tab === "url" ? "bg-black text-white" : "bg-white"}`}
          onClick={() => setTab("url")}
          type="button"
        >
          Von URL
        </button>
        <button
          className={`px-3 py-2 rounded-md border ${tab === "file" ? "bg-black text-white" : "bg-white"}`}
          onClick={() => setTab("file")}
          type="button"
        >
          Datei-Upload
        </button>
      </div>

      {/* Inhalt */}
      {tab === "manual" && <ManualForm />}
      {tab === "url" && <UrlForm />}
      {tab === "file" && <FileUploadForm />}
    </div>
  );
}

/* ---------- Manuell erfassen ---------- */
function ManualForm() {
  const [contentType, setContentType] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    const payload = {
      type: contentType,
      title,
      summary,
      tags: parseTags(tags),
      source_type: "manual",
      source_url: sourceUrl || null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("✅ Gespeichert");
      setTitle("");
      setSummary("");
      setSourceUrl("");
      setTags("");
      setContentType("");
    } catch (err) {
      console.error(err);
      setMsg("❌ Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 border rounded-lg p-4 bg-white">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Content Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            required
          >
            <option value="">Bitte wählen…</option>
            <option value="trend">Trend</option>
            <option value="technology">Technology</option>
            <option value="inspiration">Inspiration</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Titel</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. Generative Design im Wohnbau"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Kurzbeschreibung</label>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={5}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Worum geht’s?"
          required
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Quelle (optional)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…"
            type="url"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Tags (Komma-getrennt)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="BIM, ESG, Low-Carbon"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
        >
          {busy ? "Speichern…" : "Speichern"}
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </form>
  );
}

/* ---------- Von URL importieren ---------- */
function UrlForm() {
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState("");
  const [tags, setTags] = useState("");
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onPreview = async () => {
    if (!url) return;
    setLoadingPreview(true);
    setPreview(null);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/content/preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(await res.text());
      setPreview(await res.json());
    } catch (err) {
      console.error(err);
      setMsg("❌ Vorschau fehlgeschlagen");
    } finally {
      setLoadingPreview(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const payload = {
      type: contentType,
      source_type: "url",
      source_url: url,
      tags: parseTags(tags),
      title: preview?.title || null,
      summary: preview?.description || null,
      image: preview?.image || null,
      site: preview?.site || null,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("✅ Importiert");
      setUrl("");
      setTags("");
      setContentType("");
      setPreview(null);
    } catch (err) {
      console.error(err);
      setMsg("❌ Import fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 border rounded-lg p-4 bg-white">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">URL</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              type="url"
              required
            />
            <button type="button" onClick={onPreview} className="px-3 py-2 border rounded">
              Preview
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Content Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            required
          >
            <option value="">Bitte wählen…</option>
            <option value="trend">Trend</option>
            <option value="technology">Technology</option>
            <option value="inspiration">Inspiration</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Tags (Komma-getrennt)</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="AI, Nachhaltigkeit"
        />
      </div>

      {loadingPreview && <p className="text-sm text-gray-500">Lade Vorschau…</p>}
      {preview && (
        <div className="border rounded p-3">
          <p className="text-xs text-gray-500 mb-1">Vorschau</p>
          {preview.title && <h3 className="font-medium">{preview.title}</h3>}
          {preview.image && (
            <img src={preview.image} alt="" className="mt-2 max-h-40 rounded object-cover" />
          )}
          {preview.description && <p className="mt-2 text-sm">{preview.description}</p>}
          {preview.site && <p className="mt-1 text-xs text-gray-500">Quelle: {preview.site}</p>}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-60" disabled={busy}>
          {busy ? "Importieren…" : "Importieren"}
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </form>
  );
}

/* ---------- Datei-Upload ---------- */
function FileUploadForm() {
  const [contentType, setContentType] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = fileRef.current?.files?.[0];
    if (!f) {
      setMsg("❌ Bitte Datei wählen");
      return;
    }
    setMsg("");
    setProgress(0);

    const fd = new FormData();
    fd.append("file", f);
    fd.append("type", contentType);
    fd.append("title", title);
    fd.append("tags", JSON.stringify(parseTags(tags)));

    // Upload mit Fortschritt via XHR
    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE_URL}/content/upload`);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(xhr.responseText));
        xhr.onerror = reject;
        xhr.send(fd);
      });
      setMsg("✅ Upload erfolgreich");
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
      setTitle("");
      setTags("");
      setContentType("");
    } catch (err) {
      console.error(err);
      setMsg("❌ Upload fehlgeschlagen");
      setProgress(0);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 border rounded-lg p-4 bg-white">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Datei</label>
          <input ref={fileRef} type="file" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm mb-1">Content Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            required
          >
            <option value="">Bitte wählen…</option>
            <option value="trend">Trend</option>
            <option value="technology">Technology</option>
            <option value="inspiration">Inspiration</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Titel</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dateititel"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Tags (Komma-getrennt)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Plan, PDF, ESG"
          />
        </div>
      </div>

      {progress > 0 && (
        <div>
          <div className="w-full h-2 rounded bg-gray-200">
            <div className="h-2 rounded bg-black transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}%</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="px-4 py-2 rounded bg-black text-white">Hochladen</button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </form>
  );
}
