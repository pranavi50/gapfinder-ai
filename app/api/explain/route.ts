import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateGrounded } from "@/lib/ai";
import { retrieve, cite } from "@/lib/retrieval";
import type { Chunk } from "@/lib/chunk";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const b = z.object({ question:z.string().min(2).max(1200), chunks:z.array(z.object({id:z.string(),text:z.string(),source:z.string(),topic:z.string(),page:z.number().optional()})).min(1) }).parse(await req.json());
    const found = retrieve(b.question, b.chunks as Chunk[], 4);
    if (!found.length) return NextResponse.json({ answer:"I couldn't find relevant evidence in your uploaded material. Try asking with the chapter's terminology or upload the relevant section.", citations:[], grounded:true });
    if (process.env.GEMINI_API_KEY) {
      const result = await generateGrounded(`Answer the student's question in simple language. Use only the provided excerpts. If unsupported, say so. Include short citations to source names. Question: ${b.question}`, found);
      return NextResponse.json({ answer:result.text, citations:found.map(c=>({source:c.source,topic:c.topic})), grounded:true });
    }
    return NextResponse.json({ answer:`Demo retrieval found this relevant excerpt:\n\n“${found[0].text.slice(0,700)}”\n\nAdd GEMINI_API_KEY to enable generated explanations.`, citations:found.map(c=>({source:c.source,topic:c.topic})), grounded:true, demo:true });
  } catch(e) { return NextResponse.json({error:e instanceof Error?e.message:"Could not answer."},{status:400}); }
}