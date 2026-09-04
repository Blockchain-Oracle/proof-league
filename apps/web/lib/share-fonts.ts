// Fonts for the share images. satori (next/og) needs font bytes, not a stylesheet, so the
// two faces the slab uses are fetched once from Google Fonts as TTF (the css2 endpoint
// serves TTF to an older user agent) and held for the life of the process. A fetch failure
// falls back to satori's bundled face rather than failing the share.

type Font = { readonly name: string; readonly data: ArrayBuffer; readonly weight: 400 | 700 | 800; readonly style: "normal" };

const OLD_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

const globalRef = globalThis as { __plShareFonts?: Promise<Font[]> };

const fetchTtf = async (family: string, weight: 400 | 700 | 800): Promise<ArrayBuffer | undefined> => {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`, { headers: { "User-Agent": OLD_UA } });
    const url = /url\((https:[^)]+\.ttf)\)/.exec(await css.text())?.[1];
    if (url === undefined) return undefined;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return undefined;
  }
};

export const shareFonts = (): Promise<Font[]> => {
  globalRef.__plShareFonts ??= (async () => {
    const [display, mono] = await Promise.all([fetchTtf("Bricolage+Grotesque", 800), fetchTtf("JetBrains+Mono", 700)]);
    const fonts: Font[] = [];
    if (display !== undefined) fonts.push({ name: "Bricolage Grotesque", data: display, weight: 800, style: "normal" });
    if (mono !== undefined) fonts.push({ name: "JetBrains Mono", data: mono, weight: 700, style: "normal" });
    return fonts;
  })();
  return globalRef.__plShareFonts;
};
