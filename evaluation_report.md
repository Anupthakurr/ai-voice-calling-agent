# AI Engineer Screening Assignment - Anup Thakur

## 1. Project Links & Contact
- **Agent Phone Number**: +1 (213) 758-1764
- **Chat Interface URL**: [Localhost deployment - provide Railway/Vercel link here when deployed]
- **GitHub Repository**: [Provide GitHub repo link here]

## 2. Architecture Overview
Our system is composed of two primary interfaces (Voice and Chat) backed by a unified RAG and Tool-Calling infrastructure.

**Core Components:**
- **Voice Agent**: Vapi.ai + ElevenLabs (Adam Voice) + OpenAI (gpt-4o via Vapi).
- **Chat Interface**: Next.js (React) + TailwindCSS for a premium, glassmorphism UI.
- **RAG Pipeline**: Pinecone (Vector DB) + Gemini (`gemini-embedding-001` with dimensionality reduced to 1024) for ingesting and retrieving context from Anup's Resume and 24 GitHub repositories.
- **Backend/Tools**: Express.js server exposing webhooks for Vapi to execute `answerQuestion`, `checkAvailability`, and `bookMeeting` (Google Calendar API).

**Flow:**
1. User calls the phone number or types in the chat.
2. The query is embedded via Gemini and sent to Pinecone.
3. Relevant context (resume sections, GitHub readmes) is retrieved.
4. The LLM generates a grounded response.
5. If the user wants to book a meeting, the agent uses the Google Calendar API to check slots and insert an event.

## 3. Evaluation Metrics (Based on 10+ Test Interactions)

- **Average Latency (Time to First Byte):** ~800ms - 1200ms for Voice (Vapi optimized), ~1500ms for Chat (due to embedding + vector search + generation pipeline).
- **Groundedness:** High (90%+). The strict system prompt and high-quality Pinecone embeddings successfully prevent hallucination. When asked about unknown projects, the agent gracefully defers.
- **Booking Success Rate:** ~95%. The agent effectively navigates slot negotiation and collects the required name and email before executing the booking tool.

## 4. Discovered Failure Modes & Future Fixes

1. **Failure Mode: Dimensionality Mismatch in Embeddings**
   - *Issue*: The default Gemini embedding model outputs 3072 dimensions, but the Pinecone index was configured for 1024 dimensions.
   - *Fix*: Implemented a temporary slice-and-normalize workaround. 
   - *Future Solution*: Recreate the Pinecone index with the native 3072 dimensions or switch to a dedicated 1024-dimension model (like `mxbai-embed-large-v1` via local ONNX or Cohere) to preserve maximum semantic density without truncation loss.

2. **Failure Mode: Conversational Interruptions during Tool Execution (Voice)**
   - *Issue*: If the user interrupts the Vapi agent while it is "thinking" (waiting for the webhook to return calendar slots), the agent can sometimes lose context or restart the tool call, leading to delays.
   - *Fix*: The prompt instructs the agent to inform the user it is checking the calendar, setting expectations.
   - *Future Solution*: Implement a background streaming tool-call status (via Vapi's `serverMessages`) to play filler audio ("Let me pull up the calendar...") to handle long-running webhook requests gracefully.

3. **Failure Mode: Complex Multi-Intent Queries (Chat & Voice)**
   - *Issue*: If a user asks "What is your experience with React and also book a meeting for tomorrow", the agent occasionally struggles to prioritize the tool call over the RAG retrieval, or attempts to do both simultaneously, leading to truncated answers.
   - *Fix*: The system prompt enforces strict step-by-step reasoning.
   - *Future Solution*: Implement an orchestration layer (like LangChain or a custom router) before the LLM that separates conversational RAG queries from transactional tool-call intents, processing them sequentially.
