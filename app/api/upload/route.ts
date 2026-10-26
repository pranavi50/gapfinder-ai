import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { splitIntoChunks } from "@/lib/chunk";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF or text file." }, { status: 400 });
    let text = "";
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const parsed = await pdf(Buffer.from(await file.arrayBuffer()));
      text = parsed.text;
    } else if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name)) {
      text = await file.text();
    } else return NextResponse.json({ error: "Supported formats: PDF, TXT, MD and CSV." }, { status: 415 });
    if (text.trim().length < 40) return NextResponse.json({ error: "Very little text was extracted. Try a text-based PDF rather than a scanned image." }, { status: 422 });
    const chunks = splitIntoChunks(text, file.name);
    return NextResponse.json({ name: file.name, characters: text.length, chunks, preview: text.slice(0, 1600) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not parse the file." }, { status: 500 });
  }
}