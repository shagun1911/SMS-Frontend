"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Bot, MessageCircle, Loader2, Trash2, Send } from "lucide-react";
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

export function AiChat() {
    const [open, setOpen] = useState(false);
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
        <>
            <Button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-indigo-600 shadow-lg hover:bg-indigo-500 md:bottom-8 md:right-8"
                size="icon"
                title="AI Assistant"
            >
                <MessageCircle className="h-6 w-6 text-white" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex max-h-[85vh] flex-col rounded-2xl border border-gray-200 bg-white p-0 shadow-xl">
                    <DialogHeader className="border-b border-gray-100 px-4 py-3">
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Bot className="h-5 w-5 text-indigo-600" /> SSMS AI Assistant
                        </DialogTitle>
                        <p className="text-xs text-gray-500">Ask about students, fees, teachers, performance, or system help. Hindi + English.</p>
                    </DialogHeader>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 min-h-[280px] max-h-[50vh] space-y-3">
                        {messages.length === 0 && (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center">
                                <p className="text-sm text-gray-600 mb-3">Try asking:</p>
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
                                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
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
                                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 border border-gray-200 px-4 py-2.5 text-sm text-gray-600">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="px-4 text-xs text-amber-600">{error}</p>
                    )}

                    <div className="border-t border-gray-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0 text-gray-500 hover:text-gray-700"
                                onClick={clearChat}
                                title="Clear chat"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your question (e.g. Shagun class 10 details)..."
                                    className="flex-1 rounded-xl border-gray-200"
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
                            </form>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
