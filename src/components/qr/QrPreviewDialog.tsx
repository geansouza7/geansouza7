import { useEffect, useMemo, useRef, useState } from "react";

import {
  QR_ART_TEMPLATES,
  downloadQrArt,
  renderQrArtToCanvas,
} from "@/lib/qr-art";

export type QrPreviewItem = {
  id: string;
  code: string;
  name?: string | null;
  destination_url?: string | null;
  client_name?: string | null;
};

type QrPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qr: QrPreviewItem | null;
  value?: string;
  brandColor?: string;
  footerText?: string;
};

export function QrPreviewDialog({
  open,
  onOpenChange,
  qr,
  value,
  brandColor = "#4f7cff",
  footerText = "",
}: QrPreviewDialogProps) {
  const [templateId, setTemplateId] = useState(QR_ART_TEMPLATES[0].id);
  const [rendering, setRendering] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const encodedValue = useMemo(() => {
    if (value) return value;
    if (qr?.destination_url) return qr.destination_url;
    return qr?.code ?? "";
  }, [value, qr]);

  const label = useMemo(
    () => (qr?.name || qr?.client_name || qr?.code || "").trim(),
    [qr],
  );

  useEffect(() => {
    if (!open) return;
    setTemplateId(QR_ART_TEMPLATES[0].id);
    setError(null);
  }, [open, qr?.id]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || !qr) return;
    let cancelled = false;
    setRendering(true);
    setError(null);

    renderQrArtToCanvas({ templateId, value: encodedValue, label, brandColor, footerText })
      .then((art) => {
        if (cancelled) return;
        const target = canvasRef.current;
        if (!target) return;
        target.width = art.width;
        target.height = art.height;
        const ctx = target.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, target.width, target.height);
        ctx.drawImage(art, 0, 0);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Não foi possível gerar a prévia.");
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, qr, templateId, encodedValue, label, brandColor, footerText]);

  const handleDownload = async () => {
    if (!qr) return;
    setDownloading(true);
    setError(null);
    try {
      const safeCode = (qr.code || qr.id).replace(/[^a-zA-Z0-9-_]/g, "") || "qrcode";
      await downloadQrArt(
        { templateId, value: encodedValue, label, brandColor, footerText },
        `qrcode-${safeCode}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível baixar a imagem.");
    } finally {
      setDownloading(false);
    }
  };

  if (!open || !qr) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Prévia do QR code"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl"
        style={{ maxHeight: "90vh" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Prévia do QR code</h2>
            <p className="text-sm text-muted-foreground">
              {qr.name || qr.client_name || qr.code}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Fechar prévia"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-sm rounded-xl bg-muted/30 p-3">
              <canvas ref={canvasRef} className="h-auto w-full rounded-lg" />
            </div>
            {rendering && <p className="text-xs text-muted-foreground">Gerando prévia...</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Escolha a arte</h3>
              <p className="text-xs text-muted-foreground">
                O QR code é aplicado na arte selecionada.
              </p>
            </div>

            <div className="grid gap-2">
              {QR_ART_TEMPLATES.map((template) => {
                const active = template.id === templateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setTemplateId(template.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <span
                      className={`h-10 w-10 shrink-0 rounded-lg ${template.thumbnailClass}`}
                      style={{ borderColor: active ? brandColor : undefined }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {template.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {template.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || rendering}
              className="mt-auto inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {downloading ? "Baixando..." : "Baixar imagem PNG"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QrPreviewDialog;
