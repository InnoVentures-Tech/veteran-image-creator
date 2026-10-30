// Büyük harf yüksekliği / punto oranı fonta bağlıdır; "H" ölçülerek bulunur.
export const sizeForCap = (ctx: CanvasRenderingContext2D, fontAt: (size: number) => string, cap: number) => {
  ctx.font = fontAt(100);
  const ascent = ctx.measureText("H").actualBoundingBoxAscent || 72;
  return (cap / ascent) * 100;
};
