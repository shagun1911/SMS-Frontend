"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Database,
    Cloud,
    Bot,
    Sparkles,
    HardDrive,
    Zap,
    Image,
    Clock,
    Server,
    TrendingUp,
    Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ level }: { level: string }) {
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
        ok: { label: "Healthy", cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
        warning: { label: "Warning", cls: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
        critical: { label: "Critical", cls: "bg-red-100 text-red-700", icon: <XCircle className="h-3.5 w-3.5" /> },
        error: { label: "Error", cls: "bg-red-100 text-red-700", icon: <XCircle className="h-3.5 w-3.5" /> },
        invalid_key: { label: "Invalid Key", cls: "bg-red-100 text-red-700", icon: <XCircle className="h-3.5 w-3.5" /> },
    };
    const s = map[level] ?? map.ok;
    return (
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", s.cls)}>
            {s.icon} {s.label}
        </span>
    );
}

function UsageBar({ pct, level }: { pct: number; level: string }) {
    const color =
        level === "critical" ? "bg-red-500" :
        level === "warning" ? "bg-amber-500" :
        "bg-emerald-500";
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used</span>
                <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
        </div>
    );
}

function StatRow({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="text-right">
                <span className="text-sm font-medium">{value}</span>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
        </div>
    );
}

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
            </div>
            <div className="flex-1">
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            {badge}
        </div>
    );
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
    const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
        queryKey: ["master-system-health"],
        queryFn: async () => {
            const res = await api.get("/master/system-health");
            return res.data?.data ?? {};
        },
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });

    const mongo = data?.mongodb;
    const cloudinary: any[] = data?.cloudinary ?? [];
    const groq = data?.groq;
    const gemini = data?.gemini;
    const summary = data?.summary;

    const lastChecked = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Live analytics for MongoDB, Cloudinary, Groq & Gemini — know when to upgrade
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {summary && (
                        <span className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                            summary.overallStatus === "healthy"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                        )}>
                            <Activity className="h-4 w-4" />
                            {summary.overallStatus === "healthy" ? "All systems healthy" : "Attention required"}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <RefreshCw className="h-8 w-8 animate-spin" />
                        <p className="text-sm">Checking all systems…</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* ── MongoDB ──────────────────────────────────────────── */}
                    <Card className="rounded-2xl p-6">
                        <SectionHeader
                            icon={<Database className="h-5 w-5" />}
                            title="MongoDB Atlas"
                            badge={mongo ? <StatusBadge level={mongo.warningLevel ?? mongo.status} /> : null}
                        />

                        {mongo?.status === "error" ? (
                            <p className="text-sm text-red-600">{mongo.message}</p>
                        ) : mongo ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Usage bar + numbers */}
                                <div className="space-y-4">
                                    <UsageBar pct={mongo.percentUsed} level={mongo.warningLevel} />
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Data Used", value: `${mongo.usedMB} MB` },
                                            { label: "Total w/ Indexes", value: `${mongo.storageMB} MB` },
                                            { label: "Free Tier Limit", value: `${mongo.freeTierLimitMB} MB` },
                                            { label: "Free Remaining", value: `${Math.max(0, mongo.freeTierLimitMB - mongo.storageMB).toFixed(1)} MB` },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="rounded-xl bg-muted/50 p-3">
                                                <p className="text-xs text-muted-foreground">{label}</p>
                                                <p className="text-lg font-bold">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {mongo.projectedFullAtSchools != null && (
                                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                            <p className="text-xs text-amber-700">
                                                At current data rate, free tier can support approx.{" "}
                                                <strong>{mongo.projectedFullAtSchools} schools</strong> before running out.
                                            </p>
                                        </div>
                                    )}
                                    <div className="space-y-0.5">
                                        <StatRow label="Collections" value={mongo.totalCollections} />
                                        <StatRow label="Total Documents" value={mongo.estimatedDocCount.toLocaleString()} />
                                        <StatRow label="Objects in DB" value={mongo.objects.toLocaleString()} />
                                    </div>
                                </div>

                                {/* Collections breakdown */}
                                <div>
                                    <p className="mb-3 text-sm font-medium">Storage by collection (top 10)</p>
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {(mongo.collections as any[]).slice(0, 10).map((col: any) => {
                                            const pct = mongo.storageMB > 0
                                                ? Math.round(((col.sizeMB + col.indexSizeMB) / mongo.storageMB) * 100)
                                                : 0;
                                            return (
                                                <div key={col.name} className="rounded-lg border p-2.5">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium truncate max-w-[130px]">{col.name}</span>
                                                        <span className="text-xs text-muted-foreground ml-1 shrink-0">
                                                            {col.count.toLocaleString()} docs · {col.sizeMB + col.indexSizeMB} MB
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary/60"
                                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No data</p>
                        )}
                    </Card>

                    {/* ── Cloudinary ───────────────────────────────────────── */}
                    <div>
                        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                            <Image className="h-4 w-4" /> Cloudinary Accounts
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {cloudinary.length === 0 ? (
                                <p className="text-sm text-muted-foreground col-span-full">No Cloudinary accounts configured.</p>
                            ) : (
                                cloudinary.map((acc: any) => (
                                    <Card key={acc.account} className="rounded-2xl p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                                    <Cloud className="h-4.5 w-4.5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">Account {acc.account}</p>
                                                    <p className="text-xs text-muted-foreground">{acc.cloudName}</p>
                                                </div>
                                            </div>
                                            <StatusBadge level={acc.warningLevel ?? acc.status} />
                                        </div>

                                        {acc.status === "error" ? (
                                            <p className="text-xs text-red-600">{acc.message}</p>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Storage</p>
                                                    <UsageBar pct={acc.percentUsed} level={acc.warningLevel} />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {acc.storageUsedGB} GB / {acc.storageLimitGB} GB
                                                    </p>
                                                </div>
                                                <div className="space-y-0.5 text-sm">
                                                    <StatRow label="Plan" value={acc.plan} />
                                                    <StatRow label="Bandwidth Used" value={`${acc.bandwidthUsedGB} GB`} sub={`Limit: ${acc.bandwidthLimitGB} GB`} />
                                                    <StatRow label="Total Resources" value={acc.resources?.toLocaleString()} />
                                                    <StatRow label="Transformations" value={acc.transformations?.toLocaleString()} />
                                                    <StatRow label="API Requests" value={acc.requests?.toLocaleString()} />
                                                </div>
                                            </>
                                        )}
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── AI Services ─────────────────────────────────────── */}
                    <div className="grid gap-4 md:grid-cols-2">

                        {/* Groq */}
                        <Card className="rounded-2xl p-6 space-y-4">
                            <SectionHeader
                                icon={<Zap className="h-5 w-5" />}
                                title="Groq (Primary AI)"
                                badge={groq ? <StatusBadge level={groq.status} /> : null}
                            />
                            {groq?.status === "ok" ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-muted/50 p-3">
                                            <p className="text-xs text-muted-foreground">Active Model</p>
                                            <p className="text-sm font-bold truncate">{groq.activeModel}</p>
                                        </div>
                                        <div className={cn(
                                            "rounded-xl p-3",
                                            groq.modelAvailable ? "bg-emerald-50" : "bg-red-50"
                                        )}>
                                            <p className="text-xs text-muted-foreground">Model Status</p>
                                            <p className={cn("text-sm font-bold", groq.modelAvailable ? "text-emerald-700" : "text-red-700")}>
                                                {groq.modelAvailable ? "Available" : "Not Found"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                                        <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                                            <Info className="h-3.5 w-3.5" /> Free Tier Limits
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-4 text-xs text-blue-700">
                                            <span>Requests / day</span><span className="font-semibold text-right">{groq.dailyReqLimit?.toLocaleString()}</span>
                                            <span>Tokens / day</span><span className="font-semibold text-right">{groq.dailyTokenLimit?.toLocaleString()}</span>
                                            <span>Resets</span><span className="font-semibold text-right">{groq.resetSchedule}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Available Models</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(groq.availableModels ?? []).map((m: string) => (
                                                <span key={m} className={cn(
                                                    "rounded-md px-2 py-0.5 text-xs",
                                                    m === groq.activeModel
                                                        ? "bg-primary text-primary-foreground font-semibold"
                                                        : "bg-muted text-muted-foreground"
                                                )}>
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-xl bg-red-50 p-3">
                                    <p className="text-sm text-red-700 font-medium">
                                        {groq?.status === "invalid_key" ? "API key is invalid or revoked" : groq?.message ?? "Connection failed"}
                                    </p>
                                    <p className="text-xs text-red-500 mt-1">Check GROQ_API_KEY in server/.env</p>
                                </div>
                            )}
                        </Card>

                        {/* Gemini */}
                        <Card className="rounded-2xl p-6 space-y-4">
                            <SectionHeader
                                icon={<Sparkles className="h-5 w-5" />}
                                title="Gemini (Fallback AI)"
                                badge={gemini ? <StatusBadge level={gemini.status} /> : null}
                            />
                            {gemini?.status === "ok" ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-muted/50 p-3">
                                            <p className="text-xs text-muted-foreground">Active Model</p>
                                            <p className="text-sm font-bold truncate">{gemini.activeModel}</p>
                                        </div>
                                        <div className={cn(
                                            "rounded-xl p-3",
                                            gemini.modelAvailable ? "bg-emerald-50" : "bg-red-50"
                                        )}>
                                            <p className="text-xs text-muted-foreground">Model Status</p>
                                            <p className={cn("text-sm font-bold", gemini.modelAvailable ? "text-emerald-700" : "text-red-700")}>
                                                {gemini.modelAvailable ? "Available" : "Not Found"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 space-y-1.5">
                                        <p className="text-xs font-semibold text-purple-800 flex items-center gap-1.5">
                                            <Info className="h-3.5 w-3.5" /> Free Tier Limits
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-4 text-xs text-purple-700">
                                            <span>Requests / day</span><span className="font-semibold text-right">{gemini.dailyReqLimit?.toLocaleString()}</span>
                                            <span>Requests / min</span><span className="font-semibold text-right">{gemini.reqPerMinLimit}</span>
                                            <span>Resets</span><span className="font-semibold text-right">{gemini.resetSchedule}</span>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                        <p className="text-xs text-amber-700">
                                            <strong>Note:</strong> Google does not provide a token-counting API on the free tier. Live usage is not available — check{" "}
                                            <a
                                                href="https://aistudio.google.com"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline font-medium"
                                            >
                                                aistudio.google.com
                                            </a>{" "}
                                            for current quota.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-xl bg-red-50 p-3">
                                    <p className="text-sm text-red-700 font-medium">
                                        {gemini?.status === "invalid_key" ? "API key is invalid or quota exceeded" : gemini?.message ?? "Connection failed"}
                                    </p>
                                    <p className="text-xs text-red-500 mt-1">Check GEMINI_API_KEY in server/.env</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* ── Upgrade guide ────────────────────────────────────── */}
                    <Card className="rounded-2xl p-6 border-dashed">
                        <div className="flex items-start gap-3">
                            <TrendingUp className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                            <div className="space-y-3 w-full">
                                <h3 className="font-semibold">When to Upgrade — Quick Reference</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-xs text-muted-foreground">
                                                <th className="py-2 pr-4">Service</th>
                                                <th className="py-2 pr-4">Free Limit</th>
                                                <th className="py-2 pr-4">Upgrade Trigger</th>
                                                <th className="py-2">Approx. Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {[
                                                { service: "MongoDB Atlas", free: "512 MB storage", trigger: "> 75% full (~380 MB)", cost: "M10 = $57/mo" },
                                                { service: "Cloudinary", free: "25 GB storage, 25 GB BW", trigger: "> 20 GB storage or BW", cost: "Plus = $89/mo" },
                                                { service: "Groq", free: "14,400 req/day, 500K tok/day", trigger: "AI replies start failing", cost: "Dev tier = Free (higher limits)" },
                                                { service: "Gemini", free: "1,500 req/day, 15 req/min", trigger: "429 errors in logs", cost: "Gemini API paid = $0.075/1M tokens" },
                                            ].map((r) => (
                                                <tr key={r.service}>
                                                    <td className="py-2.5 pr-4 font-medium">{r.service}</td>
                                                    <td className="py-2.5 pr-4 text-muted-foreground">{r.free}</td>
                                                    <td className="py-2.5 pr-4 text-amber-700">{r.trigger}</td>
                                                    <td className="py-2.5 text-emerald-700 font-medium">{r.cost}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Footer */}
                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Last checked at {lastChecked}
                        {" · "}
                        Data refreshes every 60 seconds automatically
                    </p>
                </>
            )}
        </div>
    );
}
