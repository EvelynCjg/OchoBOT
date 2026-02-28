import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const knowledgeText = fs.readFileSync(
  path.join(process.cwd(), "data/knowledge.txt"),
  "utf-8",
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash",
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  const prompt = `
Kamu adalah chatbot berbasis knowledge internal.

ATURAN:
- Jawab hanya berdasarkan knowledge.
- Jika tidak ada di knowledge, katakan:
  "Maaf, informasi tidak tersedia dalam knowledge."

=== KNOWLEDGE ===
${knowledgeText}

=== PERTANYAAN ===
${message}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.status(200).json({ reply: response });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan." });
  }
}
