"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, Trash2, Send, Sparkles } from "lucide-react";
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
        const now = Date.now();
        if (lastSentRef.current.text === trimmed && now - lastSentRef.current.at < 2000) return;
        lastSentRef.current = { text: trimmed, at: now };
        setInput("");
        const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: trimmed, timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);
        setError(null);
        try {
            const res = await api.post("/ai/query", { message: trimmed });
            const reply = res.data?.data?.reply ?? res.data?.reply ?? "No response.";
            const assistantMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: reply, timestamp: new Date() };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? "Request failed.";
            setError(msg);
            setMessages((prev) => [
                ...prev,
                { id: `a-${Date.now()}`, role: "assistant", content: `Sorry, I couldn't process that. ${msg}`, timestamp: new Date() },
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
        <div className="flex h-full min-h-[420px] max-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-white shadow-lg transition-shadow hover:shadow-xl">
            {/* Header: light, modern */}
            <div className="flex shrink-0 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">AI Assistant</h3>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Students, fees, performance • Hindi + English</p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                    onClick={clearChat}
                    title="Clear chat"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Messages area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-4 min-h-[200px] space-y-4"
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-6 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">Ask anything about your school</p>
                        <p className="mt-1 max-w-[260px] text-xs text-[hsl(var(--muted-foreground))]">
                            Student details, fee queries, defaulters, or how to use a feature.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => sendMessage(s)}
                                    className="rounded-full border border-[hsl(var(--border))] bg-white px-4 py-2 text-xs font-medium text-[hsl(var(--foreground))] shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((m) => (
                    <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                        <div
                            className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                                m.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))] border border-[hsl(var(--border))]/50"
                            )}
                        >
                            {m.role === "user" ? (
                                <p className="whitespace-pre-wrap">{m.content}</p>
                            ) : (
                                <div className="ai-response text-left space-y-2 [&_h3]:font-semibold [&_h3]:text-[hsl(var(--foreground))] [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_p]:my-1 [&_p]:leading-relaxed [&_ul]:my-1 [&_ul]:pl-4 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-[hsl(var(--foreground))]">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-2xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]/50 px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="shrink-0 px-4 pb-1 text-xs text-destructive">{error}</p>
            )}

            {/* Input: modern pill style */}
            <form onSubmit={handleSubmit} className="shrink-0 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-3">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about students, fees, defaulters..."
                        className="min-w-0 flex-1 rounded-xl border-[hsl(var(--border))] bg-white text-sm focus-visible:ring-primary"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-xl"
                        disabled={loading || !input.trim()}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </div>
    );
}
