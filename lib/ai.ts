import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Chunk } from "./chunk";
import { cite } from "./retrieval";

export const hasAI = Boolean(process.env.GEMINI_API_KEY);

function contextOf(chunks: Chunk[]) {
  return chunks
    .map(
      (c, i) =>
        `SOURCE ${i + 1}: ${c.source}${c.page ? `, page ${c.page}` : ""}
TOPIC: ${c.topic}
TEXT:
${c.text}`
    )
    .join("\n\n---\n\n");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateGrounded(
  prompt: string,
  chunks: Chunk[]
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Please check .env.local."
    );
  }

  if (!chunks || chunks.length === 0) {
    throw new Error(
      "No matching study content found. Upload your notes and try again."
    );
  }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-3.6-flash",
  });

  const request = `You are GapFinder AI, a helpful study assistant.

Instructions:
- Answer using only the provided source excerpts.
- Explain concepts in simple English suitable for students.
- Do not invent facts.
- If the sources do not contain the answer, say so clearly.
- Include source citations where relevant.
- Return valid JSON only when explicitly requested.

SOURCE EXCERPTS:
${contextOf(chunks)}

QUESTION:
${prompt}`;

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(request);
      const answer = result.response.text();

      if (!answer || !answer.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      return {
        text: answer,
        citations: cite(chunks),
        grounded: true,
      };
    } catch (error: unknown) {
      lastError = error;

      const message =
        error instanceof Error ? error.message : String(error);

      const temporaryFailure =
        /503|429|500|502|504|overloaded|high demand|temporarily unavailable|resource exhausted/i.test(
          message
        );

      if (!temporaryFailure || attempt === 2) {
        throw new Error(
          temporaryFailure
            ? `Gemini is temporarily unavailable. Please try again. Details: ${message}`
            : `Gemini request failed: ${message}`
        );
      }

      await wait(1000 * (attempt + 1));
    }
  }

  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : "Unable to generate an answer. Please try again."
  );
}