# AI Voice Calling Agent & Chat Interface

This project is an end-to-end AI Persona built for Anup Thakur. It consists of two primary interfaces (Voice and Chat) backed by a unified RAG and Tool-Calling infrastructure, built to handle off-script conversations, answer questions using real data, and book calendar meetings autonomously.

## 🌟 Features

### 🎙️ Part A: Voice Agent
- **Live Phone Number**: Interactive AI agent answering calls.
- **Natural Conversations**: Handles interruptions, off-script chats, and recovers gracefully.
- **Tool Calling**: Connects directly to a live Express.js webhook to check calendar availability and book meetings without human intervention.
- **Tech Stack**: Vapi.ai (Agent orchestration), ElevenLabs (Adam Voice), Express.js (Webhook Backend).

### 💬 Part B: Chat Interface
- **Premium UI**: Dark-mode glassmorphism design with dynamic typing and animated message bubbles.
- **RAG-Grounded Answers**: Context is retrieved from Anup's resume and 24 GitHub repositories to answer questions accurately and avoid hallucination.
- **Inline Calendar Booking**: A custom interactive calendar widget built directly into the chat flow.
- **Tech Stack**: Next.js 14, TailwindCSS, Gemini (`gemini-2.0-flash` & `gemini-embedding-001`), Pinecone (Vector DB).

---

## 🏗️ Architecture

1. **User Input** (Voice via Vapi, or Text via Next.js Chat).
2. **Context Retrieval (RAG)**: The query is embedded via Gemini and sent to Pinecone. Relevant context (resume sections, GitHub readmes) is retrieved.
3. **LLM Generation**: The LLM uses the retrieved context and strict system prompts to generate a grounded response.
4. **Tool Execution**: If the user wants to book a meeting, the agent uses the Google Calendar API to check slots and insert an event.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Pinecone API Key
- Gemini API Key
- Vapi.ai API Key
- Google Cloud Service Account (for Calendar API)

### 1. Clone the repository
```bash
git clone https://github.com/Anupthakurr/ai-voice-calling-agent.git
cd ai-voice-calling-agent
```

### 2. Install dependencies
```bash
# Install backend dependencies
npm install

# Install chat frontend dependencies
cd chat
npm install
cd ..
```

### 3. Environment Variables
Create a `.env` file in the root directory and a `.env.local` file in the `chat/` directory using the following template:

```env
# Vapi
VAPI_API_KEY="your-vapi-key"
VAPI_PHONE_NUMBER_ID="your-vapi-phone-id"

# Gemini
GEMINI_API_KEY="your-gemini-key"

# Pinecone
PINECONE_API_KEY="your-pinecone-key"
PINECONE_INDEX_NAME="anup-persona"

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account-email"
# Remember to format private key properly, or use base64 in production
GOOGLE_PRIVATE_KEY="your-private-key-with-\n"
GOOGLE_CALENDAR_ID="anupthakur150@email.com"

# App
PORT=3001
NODE_ENV="development"
PERSONA_NAME="Anup Thakur"
```

### 4. Ingest Data (RAG)
To scrape and embed the GitHub repositories and resume into your Pinecone index:
```bash
npm run ingest
```

### 5. Start the Application
**Backend (Webhooks & Calendar Tools):**
```bash
npm run dev
```

**Frontend (Next.js Chat UI):**
```bash
cd chat
npm run dev
```

### 6. Setup Voice Agent (Vapi)
Once your backend is deployed (or exposed via ngrok), set your `WEBHOOK_URL` in the `.env` file and run:
```bash
npm run setup-vapi
```
This will automatically configure the Vapi assistant and attach it to your Vapi phone number.

---

## 📝 Evaluation Report
Please refer to the `evaluation_report.md` file for details on latency, groundedness metrics, and discovered edge-case failure modes.
