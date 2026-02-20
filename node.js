require("dotenv").config();


const {GoogleGenerativeAl} = require("@google/generative-ai");
const readlineSync = require("readline-sync");
const fs = require("fs");و

const knowledge = J50N.parse(fs.readFileSync("./data/knowledge.json", "utf-8"));

if (!process.env.GEMINI_API_KEY) {
    console.error("api tidak ada");
    process.exit(1);
}
const genAI = new GoogleGenerativeAl(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash",

});

function searchKnowledge(query) {
    const q = query.toLowercase().replace(/[^\w\s]/gi, "")
    
    const results = knowledge.filter((item) => {
        const topic = item.topic.toLowercase();
        const content = item.content.toLowerCase();

        return topic.includes(q) || q.includes(topic) || content.includes(q);
    });

    if (results.length === 0) return null;

    return results.map((item) => item.content).join("\n");
}

function buildPrompt(context, question) {
    return `
Kamu adalah chatbot berbasis data internal.

ATURAN: 
- Jawab HANYA berdasarkan informasi yang diberikan.
- Jangan menambahkan informasi dari luar.
- Jika jawaban tidak ditemukan, katakan: "Maaf, data tidak tersedia."

INFORMASI:
${context}

PERTANYAAN:
${question}
`;
}

async function startChat() {
    console.log("RAG Chatbot");
    console.log("Ketik 'exit' untuk keluar.\n");

    while (true) {
        const userInput = readlineSync.question("You: ");

        if (userInput.toLowerCase() === "exit") break;

        const context = searchKnowledge(userInput);

        if (!context) {
            console.log("\nGemini: Maaf, data tidak tersedia.\n");
            continue;
        }

        const prompt = buildPrompt(context, userInput);

        try {
            const result = await model.generateContent(prompt);
            const response = result.response.text();

            console.log("\nGemini:", response, "\n");
        } catch (error) {
            console.error("Error:", error.message);
        }
    }
}

startChat();