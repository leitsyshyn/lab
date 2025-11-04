// app/api/preview/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const runtime = "nodejs"; // needs node for parser

const pick = (root: any, selectors: string[]): string | null => {
  for (const s of selectors) {
    const el = root.querySelector(s);
    if (!el) continue;
    const v =
      el.getAttribute("content") ??
      el.getAttribute("value") ??
      el.getAttribute("href") ??
      el.text;
    if (v && String(v).trim()) return String(v).trim();
  }
  return null;
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = body?.url;
  if (!url)
    return NextResponse.json({ error: "url required" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(target.toString(), {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (LinkPreviewDemo)" },
      signal: controller.signal,
    });

    const html = await res.text();
    const root = parse(html);

    const title =
      pick(root, [
        "meta[property='og:title']",
        "meta[name='twitter:title']",
        "title",
      ]) || target.hostname;

    const description =
      pick(root, [
        "meta[property='og:description']",
        "meta[name='description']",
        "meta[name='twitter:description']",
      ]) || "";

    const ogImage =
      pick(root, [
        "meta[property='og:image']",
        "meta[property='og:image:secure_url']",
        "meta[name='twitter:image']",
      ]) || null;

    const siteName =
      pick(root, ["meta[property='og:site_name']"]) || target.hostname;

    const faviconRel =
      pick(root, [
        "link[rel='icon']",
        "link[rel='shortcut icon']",
        "link[rel='apple-touch-icon']",
      ]) || "/favicon.ico";

    const canonicalRel =
      pick(root, ["link[rel='canonical']"]) || target.toString();

    const image = ogImage ? new URL(ogImage, target).toString() : null;
    const favicon = new URL(faviconRel, target).toString();
    const canonical = new URL(canonicalRel, target).toString();

    return NextResponse.json({
      url: canonical,
      title,
      description,
      image,
      siteName,
      favicon,
    });
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "timeout" : e?.message || "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    clearTimeout(t);
  }
}
