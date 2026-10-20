import QRCode from "qrcode";

export const QR_ART_WIDTH = 1230;
export const QR_ART_HEIGHT = 1254;
export const QR_ART_SIZE = QR_ART_WIDTH;

export type QrArtData = {
  qrImage: HTMLCanvasElement;
  label: string;
  brandColor: string;
  footerText: string;
};

type QrArtRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type QrArtTemplate = {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  thumbnailClass: string;
  qrRect: QrArtRect;
  clearQrRect: QrArtRect;
  render: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: QrArtData,
  ) => void;
};

function drawUploadedArt(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: QrArtData,
  qrRect: QrArtRect,
  clearQrRect: QrArtRect,
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const image = data.qrImage as HTMLCanvasElement & { artImage?: HTMLImageElement };
  const artImage = image.artImage;
  if (!artImage) throw new Error("Não foi possível carregar a arte do QR code.");

  ctx.drawImage(artImage, 0, 0, width, height);

  const clearX = clearQrRect.x * width;
  const clearY = clearQrRect.y * height;
  const clearWidth = clearQrRect.width * width;
  const clearHeight = clearQrRect.height * height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(clearX, clearY, clearWidth, clearHeight);

  ctx.drawImage(
    data.qrImage,
    qrRect.x * width,
    qrRect.y * height,
    qrRect.width * width,
    qrRect.height * width,
  );
}

export const QR_ART_TEMPLATES: QrArtTemplate[] = [
  {
    id: "google-1",
    name: "Google – modelo 1",
    description: "Arte preta e branca para avaliações no Google",
    imageSrc: "/uploads/QR074_2_.png",
    thumbnailClass: "bg-white",
    qrRect: { x: 0.681, y: 0.667, width: 0.247, height: 0.247 },
    clearQrRect: { x: 0.635, y: 0.62, width: 0.34, height: 0.32 },
    render: (ctx, width, height, data) => {
      drawUploadedArt(
        ctx,
        width,
        height,
        data,
        QR_ART_TEMPLATES[0].qrRect,
        QR_ART_TEMPLATES[0].clearQrRect,
      );
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Arte colorida para seguidores no Instagram",
    imageSrc: "/uploads/QR074_1_.png",
    thumbnailClass: "bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600",
    qrRect: { x: 0.674, y: 0.665, width: 0.23, height: 0.23 },
    clearQrRect: { x: 0.63, y: 0.63, width: 0.32, height: 0.29 },
    render: (ctx, width, height, data) => {
      drawUploadedArt(
        ctx,
        width,
        height,
        data,
        QR_ART_TEMPLATES[1].qrRect,
        QR_ART_TEMPLATES[1].clearQrRect,
      );
    },
  },
  {
    id: "google-2",
    name: "Google – modelo 2",
    description: "Segunda versão da arte para avaliações no Google",
    imageSrc: "/uploads/QR074.png",
    thumbnailClass: "bg-white",
    qrRect: { x: 0.681, y: 0.667, width: 0.247, height: 0.247 },
    clearQrRect: { x: 0.635, y: 0.62, width: 0.34, height: 0.32 },
    render: (ctx, width, height, data) => {
      drawUploadedArt(
        ctx,
        width,
        height,
        data,
        QR_ART_TEMPLATES[2].qrRect,
        QR_ART_TEMPLATES[2].clearQrRect,
      );
    },
  },
];

export function getQrArtTemplate(id?: string): QrArtTemplate {
  return QR_ART_TEMPLATES.find((template) => template.id === id) ?? QR_ART_TEMPLATES[0];
}

export type RenderQrArtOptions = {
  templateId?: string;
  value: string;
  label?: string;
  brandColor?: string;
  footerText?: string;
  size?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a arte selecionada."));
    image.src = src;
  });
}

export async function renderQrArtToCanvas(
  options: RenderQrArtOptions,
): Promise<HTMLCanvasElement> {
  const template = getQrArtTemplate(options.templateId);
  const width = options.size ?? QR_ART_WIDTH;
  const height = Math.round(width * (QR_ART_HEIGHT / QR_ART_WIDTH));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a arte do QR code.");

  const artImage = await loadImage(template.imageSrc);
  const qrCanvas = document.createElement("canvas");
  const qrSize = Math.round(width * template.qrRect.width);

  await QRCode.toCanvas(qrCanvas, options.value || " ", {
    width: qrSize,
    margin: 0,
    color: {
      dark: "#0f172a",
      light: "#ffffff00",
    },
  });

  const qrData = qrCanvas as HTMLCanvasElement & { artImage?: HTMLImageElement };
  qrData.artImage = artImage;

  template.render(ctx, width, height, {
    qrImage: qrData,
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
