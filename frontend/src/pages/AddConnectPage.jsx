// frontend/src/pages/AddConnectPage.jsx
import React, { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertCircle,
  Globe,
  Upload,
  FileText,
} from "lucide-react";
import { API_BASE_URL } from "@/services/api";
// optional (wenn ihr <Toaster/> in App habt)
import { toast } from "sonner";

// ---------- Hilfen ----------
const CONTENT_TYPES = [
  { value: "trend", label: "Trend" },
  { value: "technology", label: "Technology" },
  { value: "inspiration", label: "Inspiration" },
];

const manualSchema = z.object({
  contentType: z.string().min(1, "Bitte Content-Typ wählen"),
  title: z.string().min(3, "Mind. 3 Zeichen"),
  summary: z.string().min(10, "Mind. 10 Zeichen"),
  tags: z.string().optional(),
  sourceUrl: z.string().url("Ungültige URL").optional().or(z.literal("")),
});

const urlSchema = z.object({
  url: z.string().url("Bitte eine gültige URL eingeben"),
  contentType: z.string().min(1, "Bitte Content-Typ wählen"),
  tags: z.string().optional(),
});

const fileSchema = z.object({
  file: z
    .any()
    .refine((f) => f instanceof File, "Bitte eine Datei wählen"),
  contentType: z.string().min(1, "Bitte Content-Typ wählen"),
  title: z.string().min(3, "Mind. 3 Zeichen"),
  tags: z.string().optional(),
});

function parseTags(str) {
  if (!str) return [];
  return str
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// ---------- Seite ----------
export default function AddConnectPage() {
  const [tab, setTab] = useState("manual");

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Add &amp; Connect</h1>
        <p className="text-muted-foreground">
          Füge neue Trends, Technologien und Inspirationen hinzu – manuell, per URL oder über Datei-Upload.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="manual">
            <FileText className="h-4 w-4 mr-2" /> Manual Entry
          </TabsTrigger>
          <TabsTrigger value="url">
            <Globe className="h-4 w-4 mr-2" /> From URL
          </TabsTrigger>
          <TabsTrigger value="file">
            <Upload className="h-4 w-4 mr-2" /> File Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <ManualForm />
        </TabsContent>

        <TabsContent value="url">
          <FromUrlForm />
        </TabsContent>

        <TabsContent value="file">
          <FileUploadForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Manual ----------
function ManualForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      contentType: "",
      title: "",
      summary: "",
      tags: "",
      sourceUrl: "",
    },
  });

  const onSubmit = async (values) => {
    const payload = {
      type: values.contentType,
      title: values.title,
      summary: values.summary,
      tags: parseTags(values.tags),
      source_url: values.sourceUrl || null,
      source_type: "manual",
    };
    try {
      const res = await fetch(`${API_BASE_URL}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      toast?.success("Content gespeichert");
    } catch (e) {
      console.error(e);
      toast?.error("Speichern fehlgeschlagen");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manuell erfassen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select
                onValueChange={(v) => setValue("contentType", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bitte wählen" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contentType && (
                <p className="text-sm text-destructive">{errors.contentType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" placeholder="z. B. Generative Design im Wohnbau" {...register("title")} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Kurzbeschreibung</Label>
            <Textarea id="summary" rows={5} placeholder="Worum geht’s?" {...register("summary")} />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Quelle (optional)</Label>
              <Input id="sourceUrl" placeholder="https://…" {...register("sourceUrl")} />
              {errors.sourceUrl && (
                <p className="text-sm text-destructive">{errors.sourceUrl.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Komma-getrennt)</Label>
              <Input id="tags" placeholder="BIM, ESG, Low-Carbon" {...register("tags")} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Speichern…" : "Speichern"}
            </Button>
            <StatusHint ok text="Wird als JSON an /api/content gesendet." />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- From URL ----------
function FromUrlForm() {
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
      contentType: "",
      tags: "",
    },
  });

  const fetchPreview = async (url) => {
    setLoadingPreview(true);
    setPreview(null);
    try {
      const res = await fetch(`${API_BASE_URL}/content/preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPreview(data); // {title, description, image, site}
    } catch (e) {
      console.error(e);
      toast?.error("Konnte Vorschau nicht laden");
    } finally {
      setLoadingPreview(false);
    }
  };

  const onSubmit = async (values) => {
    const payload = {
      type: values.contentType,
      source_type: "url",
      source_url: values.url,
      tags: parseTags(values.tags),
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
      toast?.success("Content importiert");
    } catch (e) {
      console.error(e);
      toast?.error("Import fehlgeschlagen");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Von URL importieren</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="url">URL</Label>
              <div className="flex gap-2">
                <Input id="url" placeholder="https://…" {...register("url")} />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const url = document.getElementById("url").value;
                    if (url) fetchPreview(url);
                  }}
                >
                  Preview
                </Button>
              </div>
              {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select onValueChange={(v) => setValue("contentType", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contentType && <p className="text-sm text-destructive">{errors.contentType.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Komma-getrennt)</Label>
            <Input id="tags" placeholder="AI, Nachhaltigkeit" {...register("tags")} />
          </div>

          {loadingPreview && <p className="text-sm text-muted-foreground">Lade Vorschau…</p>}
          {preview && (
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Vorschau</p>
              <h3 className="text-lg font-medium">{preview.title}</h3>
              {preview.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.image} alt="" className="mt-2 max-h-40 rounded-md object-cover" />
              )}
              {preview.description && <p className="mt-2 text-sm">{preview.description}</p>}
              {preview.site && <p className="mt-1 text-xs text-muted-foreground">Quelle: {preview.site}</p>}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>Importieren</Button>
            <StatusHint ok={!!preview} text="Sendet URL + Metadaten an /api/content" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- File Upload ----------
function FileUploadForm() {
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      file: undefined,
      contentType: "",
      title: "",
      tags: "",
    },
  });

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setValue("file", f, { shouldValidate: true });
      if (fileInputRef.current) fileInputRef.current.files = e.dataTransfer.files;
    }
  };

  const onSubmit = async (values) => {
    const fd = new FormData();
    fd.append("file", values.file);
    fd.append("type", values.contentType);
    fd.append("title", values.title);
    fd.append("tags", JSON.stringify(parseTags(values.tags)));

    try {
      // Upload mit Fortschritt via XHR (Fetch hat kein Upload-Progress)
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
      toast?.success("Datei hochgeladen");
      setProgress(0);
    } catch (e) {
      console.error(e);
      toast?.error("Upload fehlgeschlagen");
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datei hochladen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div
              className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-muted/50 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <Upload className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm mb-2">Drag & Drop oder Datei auswählen</p>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={(e) =>
                  setValue("file", e.target.files?.[0], { shouldValidate: true })
                }
              />
              {errors.file && (
                <p className="text-sm text-destructive mt-2">{errors.file.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select onValueChange={(v) => setValue("contentType", v, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contentType && (
                  <p className="text-sm text-destructive">{errors.contentType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input id="title" placeholder="Dateititel" {...register("title")} />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Komma-getrennt)</Label>
                <Input id="tags" placeholder="Plan, PDF, ESG" {...register("tags")} />
              </div>
            </div>
          </div>

          {progress > 0 && (
            <div className="w-full rounded-lg bg-muted/60 h-2">
              <div
                className="h-2 rounded-lg bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
              <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>Hochladen</Button>
            <StatusHint ok text="Lädt als multipart an /api/content/upload" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- kleine Status-Komponente ----------
function StatusHint({ ok, text }) {
  return (
    <div className="flex items-center text-sm text-muted-foreground gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-600" />
      )}
      <span>{text}</span>
    </div>
  );
}
