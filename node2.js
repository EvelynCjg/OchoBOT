require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // untuk load html

// ==============================
// Load Knowledge TXT
// ==============================
const knowledgeText = fs.readFileSync("./data/knowledge.txt", "utf-8");

// ==============================
// Setup Gemini
// ==============================
if (!process.env.GEMINI_API_KEY) {
  console.error("API key tidak ditemukan.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash",
});

// ==============================
// Memory
// ==============================
let conversationHistory = [];

// ==============================
// Build Prompt
// ==============================
function buildPrompt(question) {
  const historyText = conversationHistory
    .map((msg) => `${msg.role}: ${msg.text}`)
    .join("\n");

  return `
Kamu adalah chatbot berbasis knowledge internal.

ATURAN:
- Jawab hanya berdasarkan knowledge.
- Jika tidak ada di knowledge, katakan:
  "Maaf, informasi tidak tersedia dalam knowledge."

=== KNOWLEDGE ===
${knowledgeText}

=== PERCAKAPAN ===
${historyText}

=== PERTANYAAN ===
${question}
`;
}

// ==============================
// API Endpoint
// ==============================
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const prompt = buildPrompt(userMessage);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    conversationHistory.push({ role: "User", text: userMessage });
    conversationHistory.push({ role: "Bot", text: response });

    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    res.json({ reply: response });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan." });
  }
});

// ==============================
// Run Server
// ==============================
app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});