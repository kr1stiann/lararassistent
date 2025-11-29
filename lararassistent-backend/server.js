import express from "express";
import OpenAI from "openai";
import cors from "cors";
import dotenv from "dotenv";
import { systemPrompt } from "./prompts/systemPrompt.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ⬅ Fallback till 3001 om PORT saknas
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running ✔️");
});

// CHAT ENDPOINT
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // OpenAI call
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const answer = response.choices[0].message.content;
    res.json({ answer });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
