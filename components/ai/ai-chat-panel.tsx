"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, Trash2, Send } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const SUGGESTIONS = [
    "Shagun class 10 ki details batao",
    "Class 3 ki fee kitni hai?",
    "Defaulters list",
    "How to create session?",
];

export function AiChatPanel() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastSentRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;
        // Prevent duplicate send within 2s (e.g. double-click or Strict Mode double-invoke)
        const now = Date.now();
        if (lastSentRef.current.text === trimmed && now - lastSentRef.current.at < 2000) return;
        lastSentRef.current = { text: trimmed, at: now };
        setInput("");
        const userMsg: Message = {
            id: `u-${Date.now()}`,
            role: "user",
            content: trimmed,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);
        setError(null);
        try {
            const res = await api.post("/ai/query", { message: trimmed });
            const reply = res.data?.data?.reply ?? res.data?.reply ?? "No response.";
            const assistantMsg: Message = {
                id: `a-${Date.now()}`,
                role: "assistant",
                content: reply,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err: any) {
            const msg = err.response?.data?.message ?? err.message ?? "Request failed.";
            setError(msg);
            setMessages((prev) => [
                ...prev,
                {
                    id: `a-${Date.now()}`,
                    role: "assistant",
                    content: `Sorry, I couldn't process that. ${msg}`,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
    };

    return (
        <div className="flex h-full flex-col rounded-2xl border border-indigo-200 bg-white shadow-lg">
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">AI Assistant</h3>
                            <p className="text-xs text-indigo-100">Student, fees, performance • Hindi + English</p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-white/80 hover:bg-white/20 hover:text-white"
                        onClick={clearChat}
                        title="Clear chat"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3 py-3 min-h-[200px] max-h-[calc(100vh-320px)] space-y-3"
            >
                {messages.length === 0 && (
                    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 text-center">
                        <p className="text-sm font-medium text-indigo-900 mb-2">Enter details to fetch instantly</p>
                        <p className="text-xs text-indigo-700 mb-3">e.g. student name + class, fee query, defaulters, or system help</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => sendMessage(s)}
                                    className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={cn(
                            "flex",
                            m.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                                m.role === "user"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-900 border border-gray-200"
                            )}
                        >
                            {m.role === "user" ? (
                                <p className="whitespace-pre-wrap">{m.content}</p>
                            ) : (
                                <div className="ai-response text-left space-y-2 [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_p]:my-1 [&_p]:leading-relaxed [&_ul]:my-1 [&_ul]:pl-4 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-gray-900">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-2xl bg-gray-100 border border-gray-200 px-3 py-2 text-sm text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" /> Fetching...
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="px-3 text-xs text-amber-600">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g. Shagun class 10 details..."
                        className="flex-1 rounded-xl border-indigo-200 text-sm"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 shrink-0"
                        disabled={loading || !input.trim()}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </div>
    );
}
