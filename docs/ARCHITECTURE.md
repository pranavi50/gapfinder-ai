# Architecture and AI workflow

## Data flow

1. **Ingestion:** user selects a PDF or text-based file. `/api/upload` extracts text and splits it into chunks.
2. **Topic mapping:** a lightweight heuristic assigns topic labels to chunks. Review labels; this is a prototype taxonomy.
3. **Retrieval:** the query is tokenized and scored against chunk terms. The top matching chunks are returned. This is lexical retrieval; it is not vector search.
4. **Generation (optional Gemini):** the API sends the retrieved excerpts to Gemini with an explicit instruction to use only those excerpts. The key stays server-side.
5. **Assessment:** quiz answers are checked against the saved question key. Topic mastery is correct answers / attempted questions.
6. **Planning:** lower mastery topics receive higher priority. The learner can adjust minutes per day and days until exam.
7. **Progress:** quiz attempts are recorded in client state for the current session. A production release should persist them per authenticated user.

## Why retrieval and generation are separate

Retrieval selects evidence from the uploaded material. Generation phrases an explanation or quiz question from the selected evidence. A generated response is not itself evidence: source chunk labels are shown separately and unsupported questions should be rejected during production validation.

## Current limitations

- Keyword retrieval rather than embedding similarity.
- No persistent database or production auth in this prototype.
- PDF extraction may fail on scanned PDFs without OCR.
- Demo quiz questions are prewritten and are for demonstration; Gemini quiz questions are generated at request time when an API key is configured.
- Topic labels may need manual correction.
- A short quiz gives only a provisional signal; mastery should be estimated from more questions and multiple attempts.
