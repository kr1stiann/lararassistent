"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Bot, User, LogOut } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AUTO SCROLL -----------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // LADDA ALLA KONVERSATIONER --------------------------------------
  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const res = await fetch("/api/conversations/list", { method: "GET" });

    if (!res.ok) {
      console.error("Error loading conversations");
      setConversations([]);
      return;
    }

    const list = await res.json();
    setConversations(Array.isArray(list) ? list : []);
  }

  // ÖPPNA GAMMAL KONVO ---------------------------------------------
  async function openConversation(id: string) {
    setConversationId(id);

    const res = await fetch(`/api/messages/get?conversation_id=${id}`);
    const data = await res.json();

    const formatted = data.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    setMessages(formatted);
  }

  // LOGGA UT -------------------------------------------------------
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // SE TILL ATT KONVO FINNS ----------------------------------------
  async function ensureConversation() {
    if (conversationId) return conversationId;

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      alert("Du är inte inloggad");
      window.location.href = "/login";
      return null;
    }

    const res = await fetch("/api/conversations/create", {
      method: "POST",
      body: JSON.stringify({ user_id: data.user.id }),
    });

    const conv = await res.json();
    return conv.id; // viktigt: vi sätter inte state här ännu
  }

  // SPARA MEDDELANDE -----------------------------------------------
  async function saveMessage(convId: string, role: string, content: string) {
    await fetch("/api/messages/save", {
      method: "POST",
      body: JSON.stringify({
        conversation_id: convId,
        role,
        content,
      }),
    });
  }

  // AI-GENERERA TITEL ----------------------------------------------
  async function generateConversationTitle(message: string) {
    const prompt = `
      Skapa en kort, tydlig konversationstitel för en lärare baserat på:
      "${message}"

      Regler:
      - Max 6 ord
      - Svenska
      - Ingen punkt, inga citattecken
    `;

    const res = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    const data = await res.json();
    return (data.answer || "").trim();
  }

  // SKICKA MEDDELANDE ----------------------------------------------
  async function sendMessage() {
    if (!input.trim()) return;

    const isFirstMessage = messages.length === 0; // 👈 viktig
    const userMessage = input;

    const convId = await ensureConversation();
    if (!convId) return;

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    await saveMessage(convId, "user", userMessage);

    setInput("");
    setIsThinking(true);

    const res = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await res.json();
    setIsThinking(false);

    // Typningseffekt
    let output = "";
    const fullText = data.answer;

    setMessages([...newMessages, { role: "assistant", content: "" }]);

    for (let i = 0; i < fullText.length; i++) {
      output += fullText[i];

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = output;
        return updated;
      });

      await new Promise((res) => setTimeout(res, 8));
    }

    await saveMessage(convId, "assistant", fullText);

    // 🔥 AUTO-TITEL – bara vid första meddelandet i konvon
    if (isFirstMessage) {
      const title = await generateConversationTitle(userMessage);

      await fetch("/api/conversations/updateTitle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: convId,
          title: title || "Ny konversation",
        }),
      });

      setConversationId(convId);
      await loadConversations();
    }
  }

  // ================== UI ==================

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Bot className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-gray-800">LärarAssistenten</h1>
        </div>

        <div className="p-4 space-y-4">
          <button
            className="w-full flex items-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
            onClick={() => {
              setMessages([]);
              setConversationId(null);
            }}
          >
            <span className="w-5 h-5 bg-indigo-600 text-white rounded flex items-center justify-center">
              +
            </span>
            Ny konversation
          </button>

          <h2 className="text-xs font-semibold text-gray-400 uppercase">
            Dina konversationer
          </h2>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg border ${
                  conversationId === conv.id
                    ? "bg-indigo-100 border-indigo-300"
                    : "bg-gray-100 hover:bg-gray-200 border-gray-200"
                } transition`}
              >
                <p className="text-sm font-medium text-gray-900">
                  {conv.title || "Konversation"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(conv.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>

          <h2 className="text-xs font-semibold text-gray-400 uppercase">
            OM LÄRARASSISTENTEN
          </h2>
          <div className="bg-gray-50 p-4 text-sm text-gray-600 rounded-lg border border-gray-100">
            Detta verktyg använder GPT-modeller för att hjälpa lärare.
            <p className="text-xs text-gray-400 mt-2">
              Kontrollera alltid AI-genererat innehåll.
            </p>
          </div>
        </div>

        <div className="mt-auto p-4 border-t">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition"
          >
            <LogOut className="w-4 h-4" />
            Logga ut
          </button>
        </div>
      </aside>

      {/* MAIN CHAT */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <span className="text-gray-500">
            {messages.length > 0
              ? "Pågående konversation"
              : "Starta en ny uppgift"}
          </span>

          <button
            onClick={() => {
              setMessages([]);
              setConversationId(null);
            }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto mt-12 text-center">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">
                Vad vill du få gjort idag?
              </h2>
              <p className="text-gray-500 mb-10">
                Välj ett verktyg eller skriv direkt.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-4 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === "user" ? "bg-indigo-600" : "bg-emerald-600"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="text-white w-5 h-5" />
                    ) : (
                      <Bot className="text-white w-5 h-5" />
                    )}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <Bot className="text-white w-5 h-5" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-2">
                    <span className="animate-pulse text-gray-500">Tänker…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t">
          <div className="max-w-3xl mx-auto flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-xl p-2 shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Skriv ett meddelande…"
              className="w-full bg-transparent border-none resize-none focus:ring-0 p-2 text-gray-900 placeholder-gray-400"
              rows={1}
            />

            <button
              disabled={!input.trim()}
              onClick={sendMessage}
              className={`p-2 rounded-lg transition ${
                !input.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
