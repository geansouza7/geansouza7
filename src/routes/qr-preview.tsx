import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { QrPreviewDialog, type QrPreviewItem } from "@/components/qr/QrPreviewDialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/qr-preview")({
  component: QrPreviewPage,
});

type QrRow = QrPreviewItem & {
  status?: string | null;
  scan_count?: number | null;
};

function buildQrValue(item: QrRow, baseUrl: string): string {
  if (item.destination_url) return item.destination_url;
  if (baseUrl) return `${baseUrl.replace(/\/$/, "")}/${item.code}`;
  return item.code;
}

function QrPreviewPage() {
  const [items, setItems] = useState<QrRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<QrRow | null>(null);
  const [open, setOpen] = useState(false);
  const [brandColor, setBrandColor] = useState("#4f7cff");
  const [footerText, setFooterText] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error: listError } = await supabase
        .from("qr_codes")
        .select("id, code, name, destination_url, client_name, status, scan_count")
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      const { data: profile } = await supabase
        .from("profiles")
        .select("primary_color, footer_text, company_name, public_base_url")
        .maybeSingle();

      if (cancelled) return;

      if (listError) setError(listError.message);
      setItems((data ?? []) as unknown as QrRow[]);

      if (profile) {
        setBrandColor(profile.primary_color || "#4f7cff");
        setFooterText(profile.footer_text || profile.company_name || "");
        setBaseUrl(profile.public_base_url || "");
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Prévia dos QR codes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha um QR code para ver como ele fica na arte e baixar a imagem pronta.
          </p>
        </header>

        {loading && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">Carregando QR codes...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-medium text-destructive">Não foi possível carregar os QR codes.</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-base font-medium text-foreground">Nenhum QR code encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Gere um QR code para ver a prévia aqui.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelected(item);
                  setOpen(true);
                }}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/60 hover:shadow-lg"
              >
                <span className="font-mono text-lg font-semibold text-foreground">
                  {item.code}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.name || item.client_name || "Sem nome"}
                </span>
                <span className="mt-1 inline-flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {item.status ?? "active"}
                  </span>
                  <span>{item.scan_count ?? 0} leituras</span>
                </span>
                <span className="mt-2 text-sm font-medium text-primary group-hover:underline">
                  Ver prévia
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <QrPreviewDialog
        open={open}
        onOpenChange={setOpen}
        qr={selected}
        value={selected ? buildQrValue(selected, baseUrl) : undefined}
        brandColor={brandColor}
        footerText={footerText}
      />
    </div>
  );
}
