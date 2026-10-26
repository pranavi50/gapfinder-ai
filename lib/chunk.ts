export type Chunk = { id: string; text: string; source: string; page?: number; topic: string };
export function splitIntoChunks(text: string, source: string, maxChars = 900): Chunk[] {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/);
  const chunks: string[] = [];
  let current = "";
  for (const para of paragraphs) {
    if ((current + " " + para).length > maxChars && current) {
      chunks.push(current.trim()); current = para;
    } else current += (current ? "\n" : "") + para;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.map((part, i) => ({
    id: `${source.replace(/\W/g, "_")}_${i + 1}`,
    text: part,
    source,
    topic: inferTopic(part)
  }));
}
export function inferTopic(text: string): string {
  const candidates = [
    "Probability", "Statistics", "Machine Learning", "Neural Networks", "Database Systems",
    "Operating Systems", "Computer Networks", "Data Structures", "Algorithms", "Linear Algebra",
    "Bayes' Theorem", "Regression", "Classification", "Evaluation Metrics"
  ];
  const lower = text.toLowerCase();
  const match = candidates.find(c => lower.includes(c.toLowerCase()));
  if (match) return match;
  const first = text.split(/[.!?\n]/).map(s => s.trim()).find(s => s.length > 12) ?? "General concepts";
  return first.split(/\s+/).slice(0, 5).join(" ").replace(/[,:;]+$/, "");
}