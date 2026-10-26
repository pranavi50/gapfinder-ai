import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateGrounded } from "@/lib/ai";
import { retrieve } from "@/lib/retrieval";
import type { Chunk } from "@/lib/chunk";
export const runtime = "nodejs";
const schema = z.object({ chunks: z.array(z.object({ id:z.string(), text:z.string(), source:z.string(), topic:z.string(), page:z.number().optional() })).min(1), topics:z.array(z.string()).optional(), minutesPerDay:z.number().min(10).max(600).default(60), daysLeft:z.number().min(1).max(120).default(7) });
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const chunks = body.chunks as Chunk[];
    const topicList = [...new Set([...(body.topics ?? []), ...chunks.map(c => c.topic)])].slice(0, 12);
    const result: any[] = [];
    for (const topic of topicList) {
      const found = retrieve(topic, chunks, 4);
      if (!found.length) continue;
      if (process.env.GEMINI_API_KEY) {
        const out = await generateGrounded(`Create exactly 3 multiple-choice diagnostic questions about "${topic}" using only the excerpts. Return valid JSON array. Each item must have: question, options (array of exactly 4 strings), answer (0-based integer), explanation, source (source filename and section if known). Do not include questions unsupported by excerpts.`, found);
        try {
          const raw = out.text.replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```\s*$/,"");
          const parsed = JSON.parse(raw);
          for (const q of (Array.isArray(parsed) ? parsed : parsed.questions ?? []).slice(0,3)) result.push({ ...q, topic, source: q.source || found[0].source, grounded: true });
        } catch { result.push(...fallbackQuestions(topic, found)); }
      } else result.push(...fallbackQuestions(topic, found));
    }
    return NextResponse.json({ questions: result, topics: topicList, mode: process.env.GEMINI_API_KEY ? "gemini-rag" : "demo-retrieval" });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to build quiz." }, { status: 400 }); }
}
function fallbackQuestions(topic: string, chunks: Chunk[]) {
  const c = chunks[0]; const sentence = c.text.split(/(?<=[.!?])\s+/).find(s => s.length > 35) ?? c.text.slice(0,240);
  return [{
    topic, question: `Which statement is directly supported by the uploaded material about "${topic}"?`,
    options: [sentence.slice(0,180), "The uploaded material explicitly says the opposite.", "The topic is unrelated to the uploaded material.", "None of the terms in the excerpt appear in this topic."],
    answer: 0, explanation: `This choice repeats the retrieved source excerpt. Review the passage to verify the details.`, source: c.source, citation: `[${c.source} · ${c.topic}]`, grounded: true, demo: true
  }];
}