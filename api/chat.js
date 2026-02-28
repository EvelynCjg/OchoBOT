import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// Load knowledge
const knowledgeText = fs.readFileSync("./data/knowledge.txt", "utf-8");

// Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash",
});

// Memory (per deployment, reset tiap call)
let conversationHistory = [];

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userMessage = req.body.message;
    const prompt = buildPrompt(userMessage);

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Simpan percakapan (sementara per call)
    conversationHistory.push({ role: "User", text: userMessage });
    conversationHistory.push({ role: "Bot", text: response });
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    res.status(200).json({ reply: response });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan." });
  }
}
