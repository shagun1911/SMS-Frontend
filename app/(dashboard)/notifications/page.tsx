"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Loader2, Send, MessageSquare, Mail, Users, AlertTriangle, CheckCircle2,
    XCircle, ChevronDown, Search, Clock, Hash, UserCheck, Filter, History,
    Link2, Unlink, RefreshCw, Sparkles, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import api from "@/lib/api";
import { LockedFeatureGate } from "@/components/plan/locked-feature-gate";

const TARGET_OPTIONS = [
    { value: "all", label: "All Students", icon: Users, desc: "Send to every active student" },
    { value: "defaulters", label: "Fee Defaulters", icon: AlertTriangle, desc: "Only students with unpaid fees" },
    { value: "custom", label: "Custom Selection", icon: UserCheck, desc: "Pick specific students" },
];

const SMS_TEMPLATES = [
    { label: "Fee Reminder", text: "Dear Parent, your ward {name}'s fee of {amount} is pending for Class {class}. Please clear it before {dueDate} to avoid late charges. — {school}" },
    { label: "Payment Confirmation", text: "Dear Parent, we have received payment towards {name}'s fees. Thank you for the timely payment. — {school}" },
    { label: "Event Announcement", text: "Dear Parent, we are pleased to inform you about an upcoming event at {school}. Details will follow shortly." },
    { label: "Holiday Notice", text: "Dear Parent, please note that {school} will remain closed on {date}. Regular classes will resume on the next working day." },
    { label: "Exam Reminder", text: "Dear Parent, exams for Class {class} are approaching. Please ensure {name} is well-prepared. — {school}" },
];

const EMAIL_TEMPLATES = [
    {
        label: "Fee Reminder",
        subject: "Fee Payment Reminder – {school}",
        body: "<p>Dear Parent,</p><p>This is a reminder that your ward <b>{name}</b> (Class {class}, Section {section}) has a pending fee of <b>{amount}</b>.</p><p>Please clear the dues before <b>{dueDate}</b> to avoid any late charges.</p><p>For any queries, please contact the school office.</p><p>Regards,<br/>{school}</p>",
    },
    {
        label: "Payment Received",
        subject: "Payment Confirmation – {school}",
        body: "<p>Dear Parent,</p><p>We confirm receipt of your payment towards <b>{name}</b>'s fees (Class {class}).</p><p>Thank you for your timely payment.</p><p>Regards,<br/>{school}</p>",
    },
    {
        label: "Event Invitation",
        subject: "You're Invited! Upcoming Event at {school}",
        body: "<p>Dear Parent,</p><p>We are delighted to invite you and your ward <b>{name}</b> to an upcoming event at <b>{school}</b>.</p><p><b>Date:</b> {date}<br/><b>Venue:</b> School Auditorium</p><p>We look forward to your presence!</p><p>Regards,<br/>{school}</p>",
    },
    {
        label: "Report Card",
        subject: "Academic Report – {name} | {school}",
        body: "<p>Dear Parent,</p><p>The academic report for <b>{name}</b> (Class {class}, Section {section}) is now available.</p><p>Please visit the school portal or contact the class teacher for detailed results.</p><p>Regards,<br/>{school}</p>",
    },
];

const DYNAMIC_VARS_HELP = "{name}, {firstName}, {lastName}, {fatherName}, {class}, {section}, {amount}, {totalFee}, {paidAmount}, {school}, {date}, {dueDate}, {admissionNumber}, {phone}, {email}";

type TabId = "sms" | "email" | "history";

export default function NotificationsPage() {
    const [tab, setTab] = useState<TabId>("sms");

    return (
        <LockedFeatureGate featureKey="students" featureLabel="Notifications">
            <div className="space-y-6 p-1">
                {/* Header */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Send SMS and email notifications to students and parents.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
                    {([
                        { id: "sms" as TabId, label: "Send SMS", icon: MessageSquare },
                        { id: "email" as TabId, label: "Send Email", icon: Mail },
                        { id: "history" as TabId, label: "History", icon: History },
                    ]).map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                tab === t.id
                                    ? "bg-white shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === "sms" && <SmsTab />}
                {tab === "email" && <EmailTab />}
                {tab === "history" && <HistoryTab />}
            </div>
        </LockedFeatureGate>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SMS TAB
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function SmsTab() {
    const [target, setTarget] = useState("all");
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data: configData } = useQuery({
        queryKey: ["notif-config"],
        queryFn: async () => (await api.get("/notifications/config")).data?.data,
    });

    const { data: recipientData, isLoading: recipLoading } = useQuery({
        queryKey: ["notif-recipients", target],
        queryFn: async () => {
            const params: any = { target };
            if (target === "custom" && selectedIds.length > 0) params.ids = selectedIds.join(",");
            return (await api.get("/notifications/recipients", { params })).data?.data;
        },
    });

    const recipients = recipientData?.recipients ?? [];
    const recipientCount = target === "custom" ? selectedIds.length : (recipientData?.count ?? 0);

    const filteredRecipients = useMemo(() => {
        if (!search.trim()) return recipients;
        const q = search.toLowerCase();
        return recipients.filter((r: any) =>
            r.name?.toLowerCase().includes(q) ||
            r.phone?.includes(q) ||
            r.class?.toLowerCase().includes(q)
        );
    }, [recipients, search]);

    const sendMut = useMutation({
        mutationFn: async () => {
            const body: any = { message, target };
            if (target === "custom") body.customIds = selectedIds;
            return (await api.post("/notifications/sms", body)).data?.data;
        },
        onSuccess: (d) => {
            toast.success(`SMS sent: ${d.sent} delivered, ${d.failed} failed`);
            setShowConfirm(false);
            setMessage("");
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || "Failed to send SMS");
            setShowConfirm(false);
        },
    });

    const smsConfigured = configData?.sms ?? false;
    const charCount = message.length;
    const smsSegments = Math.ceil(charCount / 160) || 1;

    return (
        <div className="grid gap-6 lg:grid-cols-5">
            {/* Left: Compose */}
            <div className="lg:col-span-3 space-y-5">
                {!smsConfigured && (
                    <Card className="border-amber-200 bg-amber-50 p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">Twilio not configured</p>
                                <p className="text-xs text-amber-600 mt-1">
                                    Set <code className="bg-amber-100 px-1 rounded">TWILIO_ACCOUNT_SID</code>,{" "}
                                    <code className="bg-amber-100 px-1 rounded">TWILIO_AUTH_TOKEN</code>, and{" "}
                                    <code className="bg-amber-100 px-1 rounded">TWILIO_PHONE_NUMBER</code> in your server environment to enable SMS.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                <Card className="p-5 space-y-5">
                    <div>
                        <h2 className="text-base font-semibold">Compose SMS</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Select target audience and compose your message.</p>
                    </div>

                    {/* Target Group */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Audience</Label>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {TARGET_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setTarget(opt.value); setSelectedIds([]); }}
                                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                                        target === opt.value
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-border hover:border-primary/30 hover:bg-muted/30"
                                    }`}
                                >
                                    <opt.icon className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${target === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                                    <div>
                                        <p className={`text-sm font-medium ${target === opt.value ? "text-primary" : ""}`}>{opt.label}</p>
                                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Templates */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Templates</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {SMS_TEMPLATES.map((t, i) => (
                                <Button key={i} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setMessage(t.text)}>
                                    {t.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</Label>
                            <AiRewriteBtn text={message} onRewrite={setMessage} type="sms" />
                        </div>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your SMS message here... Use {name}, {amount}, {school} etc. for dynamic values."
                            className="w-full min-h-[120px] rounded-xl border border-border bg-background p-3.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    {charCount} chars
                                </span>
                                <span className={`flex items-center gap-1 ${smsSegments > 1 ? "text-amber-500" : ""}`}>
                                    <MessageSquare className="h-3 w-3" />
                                    {smsSegments} SMS segment{smsSegments !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <span>160 chars per segment</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70 leading-snug">
                            Dynamic variables: <span className="font-mono">{DYNAMIC_VARS_HELP}</span>
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" className="gap-1.5" onClick={() => setShowPreview(true)} disabled={!message.trim()}>
                            Preview
                        </Button>
                        <Button
                            className="gap-1.5 bg-blue-600 hover:bg-blue-500"
                            onClick={() => setShowConfirm(true)}
                            disabled={!message.trim() || !smsConfigured || recipientCount === 0}
                        >
                            <Send className="h-4 w-4" />
                            Send SMS to {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Right: Recipients Preview */}
            <div className="lg:col-span-2">
                <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Recipients</h3>
                        <Badge variant="outline" className="text-xs">{recipientCount} student{recipientCount !== 1 ? "s" : ""}</Badge>
                    </div>
                    {target === "custom" && (
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                    )}
                    {recipLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto space-y-1 scrollbar-thin">
                            {(target === "custom" ? filteredRecipients : recipients.slice(0, 50)).map((r: any) => (
                                <div
                                    key={r._id}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                                        target === "custom"
                                            ? selectedIds.includes(r._id)
                                                ? "bg-primary/5 border border-primary/20"
                                                : "hover:bg-muted/40 border border-transparent"
                                            : "hover:bg-muted/40"
                                    }`}
                                    onClick={() => {
                                        if (target !== "custom") return;
                                        setSelectedIds((prev) =>
                                            prev.includes(r._id)
                                                ? prev.filter((id) => id !== r._id)
                                                : [...prev, r._id]
                                        );
                                    }}
                                    style={{ cursor: target === "custom" ? "pointer" : "default" }}
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{r.name}</p>
                                        <p className="text-muted-foreground">
                                            Class {r.class}-{r.section} {r.phone ? `· ${r.phone}` : ""}
                                        </p>
                                    </div>
                                    {target === "defaulters" && r.dueAmount > 0 && (
                                        <span className="text-rose-500 font-medium shrink-0 ml-2">₹{r.dueAmount.toLocaleString("en-IN")}</span>
                                    )}
                                    {target === "custom" && (
                                        <div className={`h-4 w-4 rounded border shrink-0 ml-2 flex items-center justify-center ${
                                            selectedIds.includes(r._id) ? "bg-primary border-primary" : "border-border"
                                        }`}>
                                            {selectedIds.includes(r._id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {recipients.length > 50 && target !== "custom" && (
                                <p className="text-center text-xs text-muted-foreground py-2">
                                    Showing first 50 of {recipients.length} recipients
                                </p>
                            )}
                            {recipients.length === 0 && (
                                <p className="text-center text-xs text-muted-foreground py-8">
                                    {target === "defaulters" ? "No fee defaulters found" : "No students found"}
                                </p>
                            )}
                        </div>
                    )}
                </Card>
            </div>

            {/* Preview Modal */}
            <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="SMS Preview">
                <Card className="bg-muted/30 p-4">
                    <div className="rounded-xl bg-blue-600 text-white p-4 text-sm leading-relaxed max-w-[280px] mx-auto">
                        {message || "No message"}
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                        {charCount} characters · {smsSegments} segment{smsSegments !== 1 ? "s" : ""}
                    </p>
                </Card>
                <div className="flex justify-end pt-3">
                    <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
                </div>
            </Modal>

            {/* Confirm Modal */}
            <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm SMS Send" description={`This will send ${smsSegments} SMS segment${smsSegments !== 1 ? "s" : ""} to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}.`}>
                <div className="space-y-4">
                    <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Target</span>
                            <span className="font-medium capitalize">{target === "all" ? "All Students" : target === "defaulters" ? "Fee Defaulters" : `${selectedIds.length} Selected`}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Recipients</span>
                            <span className="font-medium">{recipientCount}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">SMS segments</span>
                            <span className="font-medium">{smsSegments}</span>
                        </div>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
                        <p className="line-clamp-3">{message}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={sendMut.isPending}>Cancel</Button>
                        <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-500 gap-1.5"
                            onClick={() => sendMut.mutate()}
                            disabled={sendMut.isPending}
                        >
                            {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Confirm & Send
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EMAIL TAB
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function EmailTab() {
    const qc = useQueryClient();
    const [target, setTarget] = useState("all");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [search, setSearch] = useState("");

    const { data: configData, isLoading: configLoading } = useQuery({
        queryKey: ["notif-config"],
        queryFn: async () => (await api.get("/notifications/config")).data?.data,
    });

    const { data: gmailStatus, refetch: refetchGmail } = useQuery({
        queryKey: ["gmail-status"],
        queryFn: async () => (await api.get("/notifications/gmail/status")).data?.data,
    });

    const { data: recipientData } = useQuery({
        queryKey: ["notif-recipients", target],
        queryFn: async () => {
            const params: any = { target };
            if (target === "custom" && selectedIds.length > 0) params.ids = selectedIds.join(",");
            return (await api.get("/notifications/recipients", { params })).data?.data;
        },
    });

    const recipients = recipientData?.recipients ?? [];
    const emailRecipients = recipients.filter((r: any) => r.email);
    const recipientCount = target === "custom" ? selectedIds.length : emailRecipients.length;

    const filteredRecipients = useMemo(() => {
        if (!search.trim()) return recipients;
        const q = search.toLowerCase();
        return recipients.filter((r: any) =>
            r.name?.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q) ||
            r.class?.toLowerCase().includes(q)
        );
    }, [recipients, search]);

    const connectGmailMut = useMutation({
        mutationFn: async () => {
            const res = await api.get("/notifications/gmail/auth-url");
            const url = res.data?.data?.url;
            if (!url) throw new Error("No auth URL returned");
            const popup = window.open(url, "gmail-auth", "width=500,height=600,scrollbars=yes");
            return new Promise<void>((resolve, reject) => {
                const interval = setInterval(() => {
                    try {
                        if (popup?.closed) {
                            clearInterval(interval);
                            reject(new Error("Popup closed before completing auth"));
                        }
                        const currentUrl = popup?.location?.href;
                        if (currentUrl && currentUrl.includes("code=")) {
                            clearInterval(interval);
                            const params = new URL(currentUrl).searchParams;
                            const code = params.get("code");
                            popup?.close();
                            if (code) {
                                api.post("/notifications/gmail/callback", { code }).then(() => resolve()).catch(reject);
                            } else {
                                reject(new Error("No code"));
                            }
                        }
                    } catch {
                        // cross-origin, still waiting
                    }
                }, 500);
                setTimeout(() => { clearInterval(interval); reject(new Error("Timeout")); }, 120000);
            });
        },
        onSuccess: () => {
            toast.success("Gmail connected successfully");
            refetchGmail();
            qc.invalidateQueries({ queryKey: ["notif-config"] });
        },
        onError: (e: any) => toast.error(e.message || "Failed to connect Gmail"),
    });

    const disconnectMut = useMutation({
        mutationFn: async () => (await api.post("/notifications/gmail/disconnect")).data,
        onSuccess: () => {
            toast.success("Gmail disconnected");
            refetchGmail();
            qc.invalidateQueries({ queryKey: ["notif-config"] });
        },
    });

    const sendMut = useMutation({
        mutationFn: async () => {
            const reqBody: any = { subject, message: body, target };
            if (target === "custom") reqBody.customIds = selectedIds;
            return (await api.post("/notifications/email", reqBody)).data?.data;
        },
        onSuccess: (d) => {
            toast.success(`Email sent: ${d.sent} delivered, ${d.failed} failed`);
            setShowConfirm(false);
            setSubject("");
            setBody("");
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || "Failed to send email");
            setShowConfirm(false);
        },
    });

    const gmailConfigured = configData?.email ?? false;
    const gmailConnected = configData?.gmailConnected ?? false;

    return (
        <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-5">
                {/* Gmail Connection Card */}
                <GmailConnectionCard
                    configured={gmailConfigured}
                    connected={gmailConnected}
                    onConnect={() => connectGmailMut.mutate()}
                    onDisconnect={() => disconnectMut.mutate()}
                    connectPending={connectGmailMut.isPending}
                    disconnectPending={disconnectMut.isPending}
                />

                <Card className="p-5 space-y-5">
                    <div>
                        <h2 className="text-base font-semibold">Compose Email</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Write your email and select the recipients.</p>
                    </div>

                    {/* Target */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Audience</Label>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {TARGET_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setTarget(opt.value); setSelectedIds([]); }}
                                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                                        target === opt.value
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-border hover:border-primary/30 hover:bg-muted/30"
                                    }`}
                                >
                                    <opt.icon className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${target === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                                    <div>
                                        <p className={`text-sm font-medium ${target === opt.value ? "text-primary" : ""}`}>{opt.label}</p>
                                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Email Templates */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Templates</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {EMAIL_TEMPLATES.map((t, i) => (
                                <Button key={i} variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSubject(t.subject); setBody(t.body); }}>
                                    {t.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</Label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject line... Use {name}, {school} for dynamic values"
                            className="h-10"
                        />
                    </div>

                    {/* Body */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Body</Label>
                            <AiRewriteBtn text={body} onRewrite={setBody} type="email" />
                        </div>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your email content here. Use {name}, {amount}, {school} for dynamic values. HTML supported."
                            className="w-full min-h-[180px] rounded-xl border border-border bg-background p-3.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">
                                Supports HTML: &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;p&gt;, &lt;a href=&quot;...&quot;&gt;
                            </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70 leading-snug">
                            Dynamic variables: <span className="font-mono">{DYNAMIC_VARS_HELP}</span>
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <Button
                            className="gap-1.5 bg-blue-600 hover:bg-blue-500"
                            onClick={() => setShowConfirm(true)}
                            disabled={!subject.trim() || !body.trim() || !gmailConnected || recipientCount === 0}
                        >
                            <Send className="h-4 w-4" />
                            Send Email to {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Right: Recipients */}
            <div className="lg:col-span-2">
                <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Recipients</h3>
                        <Badge variant="outline" className="text-xs">
                            {emailRecipients.length} with email / {recipients.length} total
                        </Badge>
                    </div>
                    {target === "custom" && (
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
                        </div>
                    )}
                    <div className="max-h-[400px] overflow-y-auto space-y-1 scrollbar-thin">
                        {(target === "custom" ? filteredRecipients : recipients.slice(0, 50)).map((r: any) => (
                            <div
                                key={r._id}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                                    target === "custom"
                                        ? selectedIds.includes(r._id)
                                            ? "bg-primary/5 border border-primary/20"
                                            : "hover:bg-muted/40 border border-transparent"
                                        : "hover:bg-muted/40"
                                }`}
                                onClick={() => {
                                    if (target !== "custom") return;
                                    setSelectedIds((prev) =>
                                        prev.includes(r._id) ? prev.filter((id) => id !== r._id) : [...prev, r._id]
                                    );
                                }}
                                style={{ cursor: target === "custom" ? "pointer" : "default" }}
                            >
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{r.name}</p>
                                    <p className="text-muted-foreground truncate">
                                        {r.email || <span className="text-amber-500">No email</span>}
                                    </p>
                                </div>
                                {target === "custom" && (
                                    <div className={`h-4 w-4 rounded border shrink-0 ml-2 flex items-center justify-center ${
                                        selectedIds.includes(r._id) ? "bg-primary border-primary" : "border-border"
                                    }`}>
                                        {selectedIds.includes(r._id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                )}
                            </div>
                        ))}
                        {recipients.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground py-8">No students found</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Confirm Modal */}
            <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Email Send" description={`This will send an email to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}.`}>
                <div className="space-y-4">
                    <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Subject</span>
                            <span className="font-medium truncate ml-4">{subject}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Target</span>
                            <span className="font-medium capitalize">{target === "all" ? "All Students" : target === "defaulters" ? "Fee Defaulters" : `${selectedIds.length} Selected`}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Recipients with email</span>
                            <span className="font-medium">{recipientCount}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={sendMut.isPending}>Cancel</Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-500 gap-1.5" onClick={() => sendMut.mutate()} disabled={sendMut.isPending}>
                            {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Confirm & Send
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HISTORY TAB
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HistoryTab() {
    const [page, setPage] = useState(1);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["notif-history", page],
        queryFn: async () => (await api.get("/notifications", { params: { page, limit: 15 } })).data?.data,
    });

    const rows = data?.rows ?? [];
    const pagination = data?.pagination ?? { total: 0, page: 1, pages: 1 };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Notification History</h2>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : rows.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <History className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No notifications sent yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Sent SMS and emails will appear here.</p>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Target</th>
                                    <th className="px-4 py-3">Message</th>
                                    <th className="px-4 py-3 text-center">Sent</th>
                                    <th className="px-4 py-3 text-center">Failed</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3">Sent By</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((n: any) => (
                                    <tr key={n._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`text-[11px] ${
                                                n.type === "sms"
                                                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                    : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                            }`}>
                                                {n.type === "sms" ? "SMS" : "Email"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs capitalize">{n.targetGroup === "all" ? "All Students" : n.targetGroup === "defaulters" ? "Defaulters" : "Custom"}</td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            {n.subject && <p className="text-xs font-medium truncate">{n.subject}</p>}
                                            <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-emerald-600 font-medium">{n.sentCount}</span>
                                            <span className="text-muted-foreground">/{n.recipientCount}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {n.failedCount > 0 ? (
                                                <span className="text-rose-500 font-medium">{n.failedCount}</span>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <NotifStatusBadge status={n.status} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">{n.createdBy?.name ?? "—"}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                            <br />
                                            <span className="text-[10px]">{new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <p className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</p>
                            <div className="flex gap-1.5">
                                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}

function NotifStatusBadge({ status }: { status: string }) {
    const map: Record<string, { cls: string; label: string }> = {
        completed: { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Completed" },
        sending: { cls: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Sending" },
        failed: { cls: "bg-rose-500/10 text-rose-500 border-rose-500/20", label: "Failed" },
        pending: { cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Pending" },
    };
    const b = map[status] ?? map.pending;
    return <Badge variant="outline" className={`text-[11px] font-medium ${b.cls}`}>{b.label}</Badge>;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GMAIL CONNECTION CARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function GmailConnectionCard({
    configured,
    connected,
    onConnect,
    onDisconnect,
    connectPending,
    disconnectPending,
}: {
    configured: boolean;
    connected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
    connectPending: boolean;
    disconnectPending: boolean;
}) {
    if (connected) {
        return (
            <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden">
                <div className="px-6 py-5">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="h-14 w-14 rounded-2xl bg-white shadow-md shadow-gray-200/60 border border-gray-100 flex items-center justify-center">
                                <img
                                    src="https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png"
                                    alt="Gmail"
                                    className="h-9 w-9"
                                    draggable={false}
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-[3px] ring-white flex items-center justify-center">
                                <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-[15px] font-semibold text-gray-900">Gmail Connected</h3>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Active
                                </span>
                            </div>
                            <p className="text-[13px] text-gray-500 mt-0.5">Your Gmail account is linked. Emails will be sent from your inbox.</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-9 rounded-lg border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shrink-0"
                            onClick={onDisconnect}
                            disabled={disconnectPending}
                        >
                            {disconnectPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                            Disconnect
                        </Button>
                    </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300" />
            </div>
        );
    }

    if (!configured) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 overflow-hidden">
                <div className="px-6 py-5">
                    <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-amber-100 flex items-center justify-center shrink-0">
                            <img
                                src="https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png"
                                alt="Gmail"
                                className="h-9 w-9 opacity-40 grayscale"
                                draggable={false}
                            />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold text-amber-900">Gmail Not Configured</h3>
                            <p className="text-[13px] text-amber-700/80 mt-1 leading-relaxed">
                                To enable email sending, add these environment variables to your server:
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"].map((v) => (
                                    <code key={v} className="inline-block rounded-md bg-amber-100/80 px-2 py-0.5 text-[11px] font-mono font-medium text-amber-800">{v}</code>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-amber-300 via-orange-200 to-amber-200" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-6">
                <div className="flex flex-col items-center text-center">
                    {/* Gmail icon with decorative ring */}
                    <div className="relative mb-5">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-100 via-blue-50 to-green-50 scale-[1.8] opacity-60" />
                        <div className="relative h-[72px] w-[72px] rounded-2xl bg-white shadow-lg shadow-gray-200/80 border border-gray-100 flex items-center justify-center">
                            <img
                                src="https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png"
                                alt="Gmail"
                                className="h-11 w-11"
                                draggable={false}
                            />
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">Connect your Gmail</h3>
                    <p className="text-[13px] text-gray-500 mt-1.5 max-w-xs leading-relaxed">
                        Link your Google account to send email notifications directly from your Gmail inbox.
                    </p>

                    {/* Google Sign-in Button — follows Google's branding guidelines */}
                    <button
                        onClick={onConnect}
                        disabled={connectPending}
                        className="mt-6 inline-flex items-center gap-3 rounded-lg border border-gray-300 bg-white pl-3 pr-5 py-2.5 shadow-sm hover:shadow-md hover:bg-gray-50 active:bg-gray-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {connectPending ? (
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        ) : (
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="h-5 w-5"
                                draggable={false}
                            />
                        )}
                        <span className="text-[14px] font-medium text-gray-700">
                            {connectPending ? "Connecting..." : "Sign in with Google"}
                        </span>
                    </button>

                    {/* Trust signals */}
                    <div className="mt-5 flex items-center gap-4 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Secure OAuth 2.0
                        </span>
                        <span className="h-3 w-px bg-gray-200" />
                        <span>No passwords stored</span>
                        <span className="h-3 w-px bg-gray-200" />
                        <span>Revoke anytime</span>
                    </div>
                </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05]" />
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AI REWRITE BUTTON
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function AiRewriteBtn({ text, onRewrite, type }: { text: string; onRewrite: (t: string) => void; type: "sms" | "email" }) {
    const rewriteMut = useMutation({
        mutationFn: async () => {
            const prompt = type === "sms"
                ? `Rewrite this SMS to be more professional, concise and impactful. Keep it under 160 chars if possible. Preserve any {variable} placeholders exactly. Only return the rewritten text, nothing else:\n\n${text}`
                : `Rewrite this email to be more professional, well-structured and impactful. Use proper HTML formatting (p, b, br tags). Preserve any {variable} placeholders exactly. Only return the rewritten HTML body, nothing else:\n\n${text}`;
            const res = await api.post("/ai/query", { message: prompt });
            return res.data?.data?.response || res.data?.data || "";
        },
        onSuccess: (data: string) => {
            if (data.trim()) {
                const cleaned = data.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
                onRewrite(cleaned);
                toast.success("Message rewritten by AI");
            }
        },
        onError: () => toast.error("AI rewrite failed"),
    });

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={() => rewriteMut.mutate()}
            disabled={!text.trim() || rewriteMut.isPending}
        >
            {rewriteMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            Rewrite with AI
        </Button>
    );
}
