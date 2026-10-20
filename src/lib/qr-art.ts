import QRCode from "qrcode";

export const QR_ART_SIZE = 1080;

const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export type QrArtData = {
  qrImage: HTMLCanvasElement;
  label: string;
  brandColor: string;
  footerText: string;
};

export type QrArtTemplate = {
  id: string;
  name: string;
  description: string;
  thumbnailClass: string;
  render: (ctx: CanvasRenderingContext2D, size: number, data: QrArtData) => void;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function shade(hex: string, amount: number): string {
  const clean = (hex || "").replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const value = parseInt(full.length === 6 ? full : "4f7cff", 16);
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const r = clamp(((value >> 16) & 255) + amount);
  const g = clamp(((value >> 8) & 255) + amount);
  const b = clamp((value & 255) + amount);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

export const QR_ART_TEMPLATES: QrArtTemplate[] = [
  {
    id: "classico",
    name: "Clássico",
    description: "Fundo branco com moldura na cor da marca",
    thumbnailClass: "bg-white border-2",
    render: (ctx, size, data) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = data.brandColor;
      ctx.lineWidth = size * 0.022;
      roundRect(ctx, size * 0.045, size * 0.045, size * 0.91, size * 0.91, size * 0.05);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (data.label) {
        ctx.fillStyle = "#0f172a";
        ctx.font = `700 ${Math.round(size * 0.055)}px ${FONT_STACK}`;
        ctx.fillText(fitText(ctx, data.label, size * 0.74), size / 2, size * 0.13);
      }

      const qrSize = size * 0.58;
      ctx.drawImage(data.qrImage, (size - qrSize) / 2, size * 0.21, qrSize, qrSize);

      if (data.footerText) {
        ctx.fillStyle = "#64748b";
        ctx.font = `500 ${Math.round(size * 0.034)}px ${FONT_STACK}`;
        ctx.fillText(fitText(ctx, data.footerText, size * 0.74), size / 2, size * 0.89);
      }
    },
  },
  {
    id: "destaque",
    name: "Destaque",
    description: "Fundo em degradê com cartão branco",
    thumbnailClass: "bg-gradient-to-br from-sky-500 to-indigo-900",
    render: (ctx, size, data) => {
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, data.brandColor);
      gradient.addColorStop(1, shade(data.brandColor, -80));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      ctx.globalAlpha = 0.14;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(size * 0.14, size * 0.1, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.9, size * 0.92, size * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      const cardX = size * 0.1;
      const cardY = size * 0.14;
      const cardW = size * 0.8;
      const cardH = size * 0.72;
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, cardX, cardY, cardW, cardH, size * 0.06);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (data.label) {
        ctx.fillStyle = "#0f172a";
        ctx.font = `700 ${Math.round(size * 0.05)}px ${FONT_STACK}`;
        ctx.fillText(fitText(ctx, data.label, cardW - size * 0.08), size / 2, cardY + size * 0.1);
      }

      const qrSize = size * 0.52;
      ctx.drawImage(data.qrImage, (size - qrSize) / 2, cardY + size * 0.15, qrSize, qrSize);

      if (data.footerText) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = `600 ${Math.round(size * 0.036)}px ${FONT_STACK}`;
        ctx.fillText(fitText(ctx, data.footerText, size * 0.8), size / 2, size * 0.93);
      }
    },
  },
  {
    id: "minimalista",
    name: "Minimalista",
    description: "Cartão claro discreto, foco total no QR",
    thumbnailClass: "bg-slate-100 border-2",
    render: (ctx, size, data) => {
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = "#ffffff";
      roundRect(ctx, size * 0.07, size * 0.07, size * 0.86, size * 0.86, size * 0.05);
      ctx.fill();

      const qrSize = size * 0.66;
      ctx.drawImage(data.qrImage, (size - qrSize) / 2, size * 0.12, qrSize, qrSize);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (data.label) {
        ctx.fillStyle = "#0f172a";
        ctx.font = `700 ${Math.round(size * 0.042)}px ${FONT_STACK}`;
        ctx.fillText(fitText(ctx, data.label, size * 0.72), size / 2, size * 0.845);
      }

      if (data.footerText) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = `500 ${Math.round(size * 0.03)}px ${FONT_STACK}`;
        ctx.fillText(fitText(ctx, data.footerText, size * 0.72), size / 2, size * 0.9);
      }
    },
  },
  {
    id: "noturno",
    name: "Noturno",
    description: "Fundo escuro com destaque na cor da marca",
    thumbnailClass: "bg-slate-900 border-2 border-slate-700",
    render: (ctx, size, data) => {
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = data.brandColor;
      roundRect(ctx, size * 0.09, size * 0.09, size * 0.16, size * 0.022, size * 0.011);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (data.label) {
        ctx.fillStyle = "#f8fafc";
        ctx.font = `700 ${Math.round(size * 0.05)}px ${FONT_STACK}`;
        ctx.fillText(fitText(ctx, data.label, size * 0.76), size / 2, size * 0.16);
      }

      const cardX = size * 0.14;
      const cardY = size * 0.22;
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, cardX, cardY, size * 0.72, size * 0.56, size * 0.04);
      ctx.fill();

      const qrSize = size * 0.5;
      ctx.drawImage(data.qrImage, (size - qrSize) / 2, cardY + size * 0.03, qrSize, qrSize);

      if (data.footerText) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = `500 ${Math.round(size * 0.034)}px ${FONT_STACK}`;
        ctx.fillText(fitText(ctx, data.footerText, size * 0.76), size / 2, size * 0.88);
      }
    },
  },
];

export function getQrArtTemplate(id?: string): QrArtTemplate {
  return QR_ART_TEMPLATES.find((t) => t.id === id) ?? QR_ART_TEMPLATES[0];
}

export type RenderQrArtOptions = {
  templateId?: string;
  value: string;
  label?: string;
  brandColor?: string;
  footerText?: string;
  size?: number;
};

export async function renderQrArtToCanvas(
  options: RenderQrArtOptions,
): Promise<HTMLCanvasElement> {
  const template = getQrArtTemplate(options.templateId);
  const size = options.size ?? QR_ART_SIZE;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a arte do QR code.");

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, options.value || " ", {
    width: Math.round(size * 0.8),
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  template.render(ctx, size, {
    qrImage: qrCanvas,
    label: (options.label ?? "").trim(),
    brandColor: options.brandColor || "#4f7cff",
    footerText: (options.footerText ?? "").trim(),
  });

  return canvas;
}

export async function downloadQrArt(
  options: RenderQrArtOptions,
  fileName: string,
): Promise<void> {
  const canvas = await renderQrArtToCanvas(options);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = fileName.toLowerCase().endsWith(".png") ? fileName : `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
