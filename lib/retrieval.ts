import type { Chunk } from "./chunk";
const STOP = new Set("the a an and or but of to in on for by with is are was were be been being this that these those from as at it its into than then can may will should could would we you your student students".split(" "));
function tokens(s: string) { return s.toLowerCase().match(/[a-z0-9']+/g)?.filter(t => !STOP.has(t)) ?? []; }
/** Transparent lexical baseline retrieval. Gemini embedding retrieval can replace this without changing the UI contract. */
export function retrieve(query: string, chunks: Chunk[], limit = 4): Chunk[] {
  const q = new Set(tokens(query));
  return chunks.map(c => {
    const terms = tokens(c.text);
    const counts = new Map<string, number>();
    for (const t of terms) counts.set(t, (counts.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of q) if (counts.has(t)) score += 1 + Math.log(counts.get(t)!);
    const topicTerms = tokens(c.topic);
    for (const t of topicTerms) if (q.has(t)) score += 2;
    return { c, score };
  }).filter(x => x.score > 0).sort((a,b) => b.score-a.score).slice(0, limit).map(x => x.c);
}
export function cite(chunks: Chunk[]) {
  return chunks.map(c => `[${c.source}${c.page ? `, page ${c.page}` : ""} · ${c.topic}]`).join(" ");
}