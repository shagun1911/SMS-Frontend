"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    CheckCircle2,
    Calendar,
    History,
    ArrowRight,
    Circle,
    CheckCircle,
    Banknote,
    UserCircle2,
    ChevronDown,
    ChevronUp,
    Edit3,
    Check,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SalaryActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffId: string;
    staffName: string;
    baseSalary: number;
}

export function SalaryActionModal({ isOpen, onClose, staffId, staffName, baseSalary }: SalaryActionModalProps) {
    const queryClient = useQueryClient();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const monthYear = `${currentMonth}-${currentYear}`;

    const [editableBaseSalary, setEditableBaseSalary] = useState<string>(String(baseSalary || 0));
    const [amountToBePaid, setAmountToBePaid] = useState<string>(String(baseSalary || 0));
    const [description, setDescription] = useState<string>(`Salary of ${currentMonth}`);
    const [status, setStatus] = useState<'pending' | 'paid'>('pending');
    const [showHistory, setShowHistory] = useState(false);
    const [isEditingBase, setIsEditingBase] = useState(false);

    // Fetch existing salary record
    const { data: salaryRecord, isLoading: isRecordLoading, refetch: refetchRecord } = useQuery({
        queryKey: ["salary-record", staffId, monthYear],
        queryFn: async () => {
            const res = await api.get(`/salaries/staff/${staffId}/${monthYear}`);
            return res.data.data;
        },
        enabled: isOpen,
    });

    // Fetch history
    const { data: salaryHistory, isLoading: isHistoryLoading } = useQuery({
        queryKey: ["salary-history", staffId],
        queryFn: async () => {
            const res = await api.get(`/salaries/staff/${staffId}/history`);
            return res.data.data;
        },
        enabled: isOpen && showHistory,
    });

    useEffect(() => {
        if (salaryRecord) {
            setEditableBaseSalary(String(salaryRecord.basicSalary));
            setAmountToBePaid(String(salaryRecord.netSalary));
            const desc = salaryRecord.remarks || (salaryRecord.allowances?.[0]?.title) || `Salary of ${currentMonth}`;
            setDescription(desc);
            setStatus(salaryRecord.status);
        } else {
            setEditableBaseSalary(String(baseSalary));
            setAmountToBePaid(String(baseSalary));
            setDescription(`Salary of ${currentMonth}`);
            setStatus('pending');
        }
    }, [salaryRecord, baseSalary, currentMonth]);

    const generateMutation = useMutation({
        mutationFn: async () => {
            return api.post("/salaries/generate", {
                month: currentMonth,
                year: currentYear,
                specificStaffId: staffId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["salary-record"] });
            refetchRecord();
        }
    });

    const updateAndPayMutation = useMutation({
        mutationFn: async (targetStatus: 'pending' | 'paid') => {
            if (!salaryRecord) return;

            const net = Number(amountToBePaid);
            const base = Number(editableBaseSalary);
            const difference = net - base;

            const allowances = difference > 0 ? [{ title: description, amount: difference }] : [];
            const deductions = difference < 0 ? [{ title: description, amount: Math.abs(difference) }] : [];

            await api.patch(`/salaries/${salaryRecord._id}`, {
                basicSalary: base,
                allowances,
                deductions,
                remarks: description
            });

            if (targetStatus === 'paid' && salaryRecord.status !== 'paid') {
                return api.post(`/salaries/${salaryRecord._id}/pay`, {
                    mode: "cash",
                    amount: net,
                    remarks: description
                });
            }
        },
        onSuccess: (_, targetStatus) => {
            toast.success(targetStatus === 'paid' ? "Payment Finalized" : "Record Updated");
            queryClient.invalidateQueries({ queryKey: ["salary-record"] });
            queryClient.invalidateQueries({ queryKey: ["salary-history"] });
            refetchRecord();
            setIsEditingBase(false);
        }
    });

    if (!isOpen) return null;

    const isRecordPaid = status === 'paid';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={staffName}
            description="Manage Monthly Payroll"
            className="max-w-2xl bg-white p-0 border-none rounded-3xl shadow-2xl overflow-hidden text-slate-900 border border-slate-200"
        >
            <div className="flex flex-col h-full">
                {/* Header Section */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-100">
                            {staffName.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{staffName}</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{monthYear}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-10">
                    {isRecordLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                        </div>
                    ) : !salaryRecord ? (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6 text-blue-500">
                                <Calendar className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No Record for {monthYear}</h3>
                            <p className="text-slate-500 text-sm mb-8">Generate the salary record to start processing.</p>
                            <Button
                                onClick={() => generateMutation.mutate()}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-black h-14 px-12 rounded-2xl shadow-xl shadow-blue-100"
                            >
                                Generate Salary Record
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Editable Base Salary */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Personnel Base Salary</Label>
                                    {!isRecordPaid && (
                                        <button
                                            onClick={() => setIsEditingBase(!isEditingBase)}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                                        >
                                            {isEditingBase ? <><X className="w-3 h-3" /> Cancel</> : <><Edit3 className="w-3 h-3" /> Change Base</>}
                                        </button>
                                    )}
                                </div>
                                <div className={cn(
                                    "relative h-20 rounded-3xl border-2 transition-all flex items-center px-8",
                                    isEditingBase ? "border-blue-500 bg-white ring-4 ring-blue-50" : "border-slate-100 bg-slate-50/50"
                                )}>
                                    <span className="text-2xl font-black text-slate-400 mr-2">₹</span>
                                    <Input
                                        type="number"
                                        value={editableBaseSalary}
                                        readOnly={!isEditingBase || isRecordPaid}
                                        onChange={(e) => setEditableBaseSalary(e.target.value)}
                                        className="bg-transparent border-none p-0 text-4xl font-black text-slate-900 focus-visible:ring-0 w-full"
                                    />
                                    {isEditingBase && <Check className="w-6 h-6 text-blue-500 animate-pulse" />}
                                </div>
                            </div>

                            {/* Monthly Payout & Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Amount to be Paid</Label>
                                    <div className="relative h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center px-6">
                                        <span className="text-lg font-black text-emerald-600 mr-2">₹</span>
                                        <Input
                                            type="number"
                                            value={amountToBePaid}
                                            readOnly={isRecordPaid}
                                            onChange={(e) => setAmountToBePaid(e.target.value)}
                                            className="bg-transparent border-none p-0 text-2xl font-black text-emerald-700 focus-visible:ring-0 w-full"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Description</Label>
                                    <div className="relative h-16 rounded-2xl bg-slate-100 border-2 border-slate-100 flex items-center px-6 group focus-within:bg-white focus-within:border-blue-500 transition-all">
                                        <Input
                                            placeholder="e.g. Salary Feb"
                                            value={description}
                                            readOnly={isRecordPaid}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="bg-transparent border-none p-0 text-lg font-bold text-slate-800 focus-visible:ring-0 w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status Selector */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Payment Status</Label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => !isRecordPaid && setStatus('pending')}
                                        disabled={isRecordPaid}
                                        className={cn(
                                            "flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all border-2",
                                            status === 'pending' ? "bg-amber-50 border-amber-500 text-amber-600 shadow-[0_4px_20px_rgba(245,158,11,0.1)]" : "bg-white border-slate-100 text-slate-300"
                                        )}
                                    >
                                        <Circle className={cn("w-4 h-4", status === 'pending' ? "fill-amber-500 text-amber-500" : "")} />
                                        Pending
                                    </button>
                                    <button
                                        onClick={() => !isRecordPaid && setStatus('paid')}
                                        className={cn(
                                            "flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all border-2",
                                            status === 'paid' ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-[0_4px_20px_rgba(16,185,129,0.1)]" : "bg-white border-slate-100 text-slate-300"
                                        )}
                                    >
                                        <CheckCircle className={cn("w-4 h-4", status === 'paid' ? "fill-emerald-500 text-white" : "")} />
                                        Paid
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-8 border-t border-slate-100 flex gap-4">
                                {isRecordPaid ? (
                                    <div className="w-full h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-xl shadow-xl shadow-emerald-100">
                                        <CheckCircle2 className="w-7 h-7" /> Payment Finalized
                                    </div>
                                ) : (
                                    <>
                                        <Button
                                            onClick={() => updateAndPayMutation.mutate('pending')}
                                            disabled={updateAndPayMutation.isPending}
                                            variant="ghost"
                                            className="flex-1 h-16 rounded-[1.5rem] font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                                        >
                                            Save Draft
                                        </Button>
                                        <Button
                                            onClick={() => updateAndPayMutation.mutate('paid')}
                                            disabled={updateAndPayMutation.isPending}
                                            className="flex-[2] h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl gap-3 shadow-2xl shadow-blue-200"
                                        >
                                            {updateAndPayMutation.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : <Banknote className="w-7 h-7" />}
                                            Disburse ₹{amountToBePaid}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {/* Collapsible History Section */}
                    <div className="bg-slate-50 -mx-8 -mb-8 mt-10 p-8 pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-900 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <div className="flex items-center gap-3">
                                <History className="w-4 h-4" />
                                Payment Ledger
                            </div>
                            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showHistory && (
                            <div className="mt-6 space-y-3 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {isHistoryLoading ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
                                ) : !salaryHistory || salaryHistory.length === 0 ? (
                                    <div className="text-center py-20 bg-white/50 rounded-3xl border border-slate-100">
                                        <p className="text-xs text-slate-400 font-bold">No historical data available</p>
                                    </div>
                                ) : (
                                    salaryHistory.map((h: any) => (
                                        <div key={h._id} className="bg-white border-2 border-slate-50 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:border-blue-100 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100">
                                                    <span className="text-[8px] font-black text-slate-400 leading-none uppercase">{h.month.substring(0, 3)}</span>
                                                    <span className="text-base font-black text-slate-800 leading-none mt-1">{h.year}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-lg font-black text-slate-900 leading-none">₹{h.netSalary}</p>
                                                        <Badge className="bg-emerald-50 text-emerald-500 border-none px-2 py-0 text-[8px] font-black">PAID</Badge>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{h.remarks || 'Monthly Salary'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-300 uppercase">Ref: {h._id.slice(-8)}</p>
                                                <button className="text-[9px] font-black text-blue-500 uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity">View Receipt</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
