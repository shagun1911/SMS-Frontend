"use client";

import { useState, useMemo } from "react";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Loader2,
    UserPlus,
    Camera,
    CheckCircle2,
    FileCheck,
    QrCode,
    RefreshCw,
    XCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef } from "react";
import { StudentRegistrationSuccess } from "@/components/dashboard/student-registration-success";

const studentSchema = z.object({
    admissionNumber: z.string().optional(),
    firstName: z.string().min(2, "First name required"),
    lastName: z.string().max(200),
    fatherName: z.string().min(2, "Father name required"),
    motherName: z.string().min(2, "Mother name required"),
    dateOfBirth: z.string().min(1, "DOB required"),
    gender: z.enum(["Male", "Female", "Other"]),
    class: z.string().min(1, "Class required"),
    section: z.string().min(1, "Section required"),
    phone: z.string().min(10, "Valid phone needed"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    photo: z.string().optional(),
    tcSubmitted: z.boolean().default(false),
    migrationSubmitted: z.boolean().default(false),
    usesTransport: z.boolean().default(false),
    transportDestinationId: z.string().optional(),
    initialDepositAmount: z.coerce.number().min(0).optional(),
    // Concession should stay exact (no rounding drift). Force integer rupees only.
    concessionAmount: z.coerce.number().int().min(0).optional(),
    /** % of annual recurring (monthly × session months) fee only; one-time fees excluded. */
    concessionPercent: z.coerce.number().min(0).max(100).optional(),
    depositPaymentMode: z.string().optional(),
    depositTransactionId: z.string().optional(),
    address: z.object({
        street: z.string().min(1, "Street required"),
        city: z.string().min(1, "City required"),
        state: z.string().min(1, "State required"),
        pincode: z.string().min(6, "Valid pincode needed"),
    }),
});

type StudentValues = z.infer<typeof studentSchema>;

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddStudentModal({ isOpen, onClose }: AddStudentModalProps) {
    const queryClient = useQueryClient();
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [depositManuallyEdited, setDepositManuallyEdited] = useState(false);
    const [registeredStudent, setRegisteredStudent] = useState<any>(null);
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<StudentValues>({
        resolver: zodResolver(studentSchema) as Resolver<StudentValues>,
        defaultValues: {
            gender: "Male",
            photo: "",
            tcSubmitted: false,
            migrationSubmitted: false,
            address: {
                state: "Rajasthan",
                city: "Bikaner"
            }
        }
    });

    const selectedClass = watch("class");
    const depositAmountRaw = watch("initialDepositAmount");
    const hasExplicitDepositAmount =
        depositAmountRaw !== undefined &&
        depositAmountRaw !== null &&
        String(depositAmountRaw).trim() !== "";
    const depositAmount = Number(depositAmountRaw ?? 0);
    const concessionAmount = watch("concessionAmount") || 0;
    const concessionPercentRaw = watch("concessionPercent");
    const concessionPercent = Math.min(100, Math.max(0, Number(concessionPercentRaw) || 0));
    const paymentMode = watch("depositPaymentMode");
    const usesTransport = watch("usesTransport");
    const transportDestinationId = watch("transportDestinationId");

    // Payment States
    const [qrData, setQrData] = useState<string | null>(null);
    const [status, setStatus] = useState<"IDLE" | "GENERATING" | "WAITING" | "VERIFYING" | "COMPLETED" | "FAILED">("IDLE");
    const [merchantTransactionId, setMerchantTransactionId] = useState<string | null>(null);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    // Reset payment state when modal closes or amount/mode changes
    useEffect(() => {
        if (!isOpen) {
            setStatus("IDLE");
            setQrData(null);
            setMerchantTransactionId(null);
            setDepositManuallyEdited(false);
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
    }, [isOpen]);

    useEffect(() => {
        if (status !== "COMPLETED") {
            setStatus("IDLE");
            setQrData(null);
            setMerchantTransactionId(null);
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
            }
        }
    }, [depositAmount, paymentMode]);

    const startPolling = (tid: string) => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        pollingInterval.current = setInterval(async () => {
            try {
                const res = await api.get(`/payments/status/${tid}`);
                if (res.data.data.state === "COMPLETED") {
                    setStatus("COMPLETED");
                    clearInterval(pollingInterval.current!);
                    toast.success("Payment Successful!", { description: "You can now finalize the enrollment." });
                } else if (res.data.data.state === "FAILED") {
                    setStatus("FAILED");
                    clearInterval(pollingInterval.current!);
                    toast.error("Payment Failed", { description: "Please try again or use a different mode." });
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 3000);
    };

    const handleGenerateQR = async () => {
        if (!depositAmount || depositAmount <= 0) {
            toast.error("Invalid Amount", { description: "Please enter a valid deposit amount." });
            return;
        }
        setStatus("GENERATING");
        try {
            const firstName = watch("firstName");
            const lastName = watch("lastName");
            const studentName = [firstName, lastName].map((s) => (s || "").trim()).filter(Boolean).join(" ");
            const res = await api.post("/payments/generate-qr", {
                amount: depositAmount,
                metadata: {
                    type: "admission_deposit",
                    studentName: studentName || firstName?.trim() || "Student",
                }
            });
            setQrData(res.data.data.qrData);
            setMerchantTransactionId(res.data.data.merchantTransactionId);
            setStatus("WAITING");
            startPolling(res.data.data.merchantTransactionId);
        } catch (error: any) {
            setStatus("IDLE");
            toast.error("QR Generation Failed", { description: error.response?.data?.message || "Internal error" });
        }
    };

    const { data: classes } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? [];
        },
        enabled: isOpen,
    });

    const distinctClasses = useMemo(() => {
        if (!Array.isArray(classes)) return [];
        const uniqueNames = Array.from(new Set(classes.map((c: any) => String(c.className || "").trim())));
        return uniqueNames.filter(Boolean).sort((a, b) => {
            const na = parseInt(a);
            const nb = parseInt(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
        });
    }, [classes]);

    // Fetch fee structure for selected class to suggest initial deposit (sum of all one-time fees only)
    const { data: feeStructure } = useQuery({
        queryKey: ["fee-structure-for-class", selectedClass],
        queryFn: async () => {
            if (!selectedClass) return null;
            const res = await api.get(`/fees/structure/${encodeURIComponent(selectedClass)}`);
            return res.data.data ?? res.data;
        },
        enabled: !!selectedClass && isOpen,
    });

    const { data: transportDestinations } = useQuery({
        queryKey: ["transport-destinations"],
        queryFn: async () => {
            const res = await api.get("/transport/destinations");
            return res.data.data ?? [];
        },
        enabled: isOpen,
    });

    const suggestedInitialDeposit = useMemo(() => {
        const s: any = feeStructure;
        if (!s) return 0;

        const components =
            Array.isArray(s.components) && s.components.length > 0
                ? s.components
                : (s.fees || []).map((f: any) => ({
                      amount: f.amount,
                      type: f.type,
                  }));

        let oneTimeTotal = 0;
        components.forEach((c: any) => {
            if (!c || typeof c.amount !== "number") return;
            const t = (c.type || "").toString().toLowerCase();
            if (t === "one-time" || t === "one_time" || t === "one time") {
                oneTimeTotal += c.amount;
            }
        });

        return oneTimeTotal;
    }, [feeStructure]);

    // Live concession breakdown: flat + % of annual recurring (monthly) total only — not one-time fees or transport.
    const concessionBreakdown = useMemo(() => {
        const s: any = feeStructure;
        if (!s) return null;

        const components =
            Array.isArray(s.components) && s.components.length > 0
                ? s.components
                : (s.fees || []).map((f: any) => ({ amount: f.amount, type: f.type }));

        let monthlyTotal = 0;
        let oneTimeTotal = 0;
        components.forEach((c: any) => {
            if (!c || typeof c.amount !== "number") return;
            const t = (c.type || "").toString().toLowerCase();
            if (t === "one-time" || t === "one_time" || t === "one time") oneTimeTotal += c.amount;
            else if (t === "monthly") monthlyTotal += c.amount;
        });

        // Get transport fee if selected
        let transportMonthly = 0;
        let transportDestinationName = "";
        if (usesTransport && transportDestinationId && transportDestinations) {
            const dest = transportDestinations.find((d: any) => d._id === transportDestinationId);
            if (dest) {
                transportMonthly = Number(dest.monthlyFee) || 0;
                transportDestinationName = dest.destinationName || "";
            }
        }

        const fullYearMonths = 12;
        const exemptMonths = Array.isArray(s.feeExemptMonths) ? s.feeExemptMonths : [];
        const exemptCount = new Set(
            exemptMonths.map((m: string) => String(m || "").trim()).filter(Boolean)
        ).size;
        const busChargeableMonths =
            typeof s.monthlyMultiplier === "number"
                ? Math.max(0, Math.min(fullYearMonths, Number(s.monthlyMultiplier) || 0))
                : Math.max(0, fullYearMonths - exemptCount);

        // Concession applies ONLY to base monthly fees (excluding transport)
        const annualMonthly = monthlyTotal * fullYearMonths;
        const fromPercent =
            concessionPercent > 0 ? Math.round((annualMonthly * concessionPercent) / 100) : 0;
        const flat = Math.max(0, Math.round(Number(concessionAmount) || 0));
        const totalConcession = Math.min(annualMonthly, flat + fromPercent);

        const adjustedAnnualMonthly = Math.max(0, annualMonthly - totalConcession);
        const adjustedPerMonth = Math.round(adjustedAnnualMonthly / fullYearMonths);
        
        // Transport annual fee (not discounted)
        const annualTransport = transportMonthly * busChargeableMonths;
        
        // Total monthly after concession (base + transport)
        const totalMonthlyAfterConcession = adjustedPerMonth + transportMonthly;
        
        // Complete yearly fee (adjusted monthly + one-time + transport)
        const newTotalYearly = adjustedAnnualMonthly + oneTimeTotal + annualTransport;

        return {
            sessionMonths: fullYearMonths,
            busChargeableMonths,
            baseMonthlyTotal: monthlyTotal,
            transportMonthly,
            transportDestinationName,
            annualMonthly,
            annualTransport,
            adjustedAnnualMonthly,
            adjustedPerMonth,
            totalMonthlyAfterConcession,
            oneTimeTotal,
            totalBeforeConcession: annualMonthly + oneTimeTotal + annualTransport,
            newTotalYearly,
            flat,
            fromPercent,
            totalConcession,
            concessionPercent,
        };
    }, [feeStructure, concessionAmount, concessionPercent, usesTransport, transportDestinationId, transportDestinations]);

    // Auto-fill initial deposit with suggested amount only when untouched/empty.
    // If user explicitly sets 0, preserve 0 instead of re-filling suggestion.
    useEffect(() => {
        if (
            isOpen &&
            selectedClass &&
            suggestedInitialDeposit > 0 &&
            !hasExplicitDepositAmount &&
            !depositManuallyEdited
        ) {
            setValue("initialDepositAmount", suggestedInitialDeposit, { shouldValidate: true });
        }
    }, [isOpen, selectedClass, suggestedInitialDeposit, hasExplicitDepositAmount, depositManuallyEdited, setValue]);

    const availableSections = useMemo(() => {
        if (!Array.isArray(classes) || !selectedClass) return [];
        const sectionsSet = new Set<string>();
        const targetClass = String(selectedClass).trim();

        classes.forEach((c: any) => {
            const cName = String(c.className || "").trim();
            if (cName === targetClass) {
                if (c.section) sectionsSet.add(String(c.section).trim().toUpperCase());
                if (Array.isArray(c.sections)) {
                    c.sections.forEach((s: any) => {
                        if (s) sectionsSet.add(String(s).trim().toUpperCase());
                    });
                }
            }
        });

        return Array.from(sectionsSet).sort();
    }, [classes, selectedClass]);

    const isTcChecked = watch("tcSubmitted");
    const isMigrationChecked = watch("migrationSubmitted");

    const mutation = useMutation({
        mutationFn: (data: StudentValues) => api.post("/students", data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success("Student Enrolled", {
                description: "The student record has been saved to the database."
            });
            setRegisteredStudent(response.data.data);
            reset();
            setPhotoPreview(null);
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.response?.data?.error || error.message;
            const desc = msg && msg !== "Something went wrong" ? msg : "Check your connection and try again.";
            toast.error("Enrollment Failed", { description: desc });
        }
    });

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview local
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to backend
        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await api.post("/upload/image?folder=students", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setValue("photo", res.data.data.url);
            toast.success("Photo Uploaded");
        } catch (error) {
            toast.error("Upload Failed");
            setPhotoPreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSuccessClose = () => {
        setRegisteredStudent(null);
        onClose();
    };

    const onSubmit: SubmitHandler<StudentValues> = (data) => {
        const isOnline = ["upi", "online"].includes(data.depositPaymentMode || "");
        if (isOnline && (data.initialDepositAmount || 0) > 0 && status !== "COMPLETED") {
            toast.info("Payment Required", { description: "Please complete the UPI payment using the QR code first." });
            return;
        }

        // Include the verified transaction ID
        const finalData = {
            ...data,
            depositTransactionId: merchantTransactionId || undefined
        };

        mutation.mutate(finalData);
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Student Enrollment"
                description="Complete the registration by providing personal and document details."
                className="max-w-3xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-h-[75vh] overflow-y-auto px-1 pr-4 scrollbar-hide">

                {/* Section: Profile Image */}
                <div className="flex flex-col items-center gap-4 py-4 bg-white/2 border border-white/5 rounded-3xl">
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => document.getElementById("photo-upload")?.click()}
                    >
                        <Avatar className="h-24 w-24 border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 transition-colors group-hover:border-indigo-300">
                            {photoPreview ? (
                                <AvatarImage src={photoPreview} className="object-cover" />
                            ) : (
                                <AvatarFallback className="bg-transparent">
                                    {isUploading ? (
                                        <Loader2 className="h-8 w-8 text-zinc-500 animate-spin" />
                                    ) : (
                                        <Camera className="h-8 w-8 text-zinc-500 group-hover:text-purple-400" />
                                    )}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                {isUploading ? "Uploading..." : "Click to Upload"}
                            </span>
                        </div>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                        />
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-sm font-bold text-white">Student Portrait</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">PNG or JPG up to 2MB</p>
                    </div>
                </div>

                {/* Section: Personal Information */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-6 bg-purple-500 rounded-full" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Identity Details</h3>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Admission Number <span className="text-zinc-400 normal-case">(optional - leave blank to auto-generate)</span></label>
                        <Input {...register("admissionNumber")} placeholder="Auto-generated if empty" className="h-10 rounded-xl border-gray-200 bg-white" />
                        {errors.admissionNumber && <p className="text-[10px] text-red-400 ml-1">{errors.admissionNumber.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">First Name</label>
                            <Input {...register("firstName")} placeholder="John" className="h-10 rounded-xl border-gray-200 bg-white" />
                            {errors.firstName && <p className="text-[10px] text-red-400 ml-1">{errors.firstName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Last Name <span className="text-zinc-400 normal-case">(optional)</span></label>
                            <Input {...register("lastName")} placeholder="Doe" className="h-10 rounded-xl border-gray-200 bg-white" />
                            {errors.lastName && <p className="text-[10px] text-red-400 ml-1">{errors.lastName.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Father's Name</label>
                            <Input {...register("fatherName")} placeholder="Mr. Smith Doe" className="h-10 rounded-xl border-gray-200 bg-white" />
                            {errors.fatherName && <p className="text-[10px] text-red-400 ml-1">{errors.fatherName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Mother's Name</label>
                            <Input {...register("motherName")} placeholder="Mrs. Jane Doe" className="h-10 rounded-xl border-gray-200 bg-white" />
                            {errors.motherName && <p className="text-[10px] text-red-400 ml-1">{errors.motherName.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Birth Date</label>
                            <Input {...register("dateOfBirth")} type="date" className="h-10 rounded-xl border-gray-200 bg-white" />
                            {errors.dateOfBirth && <p className="text-[10px] text-red-400 ml-1">{errors.dateOfBirth.message}</p>}
                        </div>
                        <Select
                            label="Gender"
                            options={[
                                { label: "Male", value: "Male" },
                                { label: "Female", value: "Female" },
                                { label: "Other", value: "Other" },
                            ]}
                            {...register("gender")}
                        />
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Contact No</label>
                            <Input {...register("phone")} placeholder="+91 00000 00000" className="h-10 rounded-xl border-gray-200 bg-white" />
                            {errors.phone && <p className="text-[10px] text-red-400 ml-1">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Email <span className="text-zinc-400 normal-case">(optional)</span></label>
                        <Input {...register("email")} type="email" placeholder="student@example.com" className="h-10 rounded-xl border-gray-200 bg-white" />
                        {errors.email && <p className="text-[10px] text-red-400 ml-1">{errors.email.message}</p>}
                    </div>
                </div>

                {/* Section: Academic Assignment */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-6 bg-blue-500 rounded-full" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Academic Scope</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Target Class"
                            options={[
                                { label: "Select Class", value: "" },
                                ...distinctClasses.map((className: string) => ({
                                    label: `Class ${className}`,
                                    value: className
                                }))
                            ]}
                            {...register("class", {
                                onChange: () => setValue("section", "")
                            })}
                            error={errors.class?.message}
                        />
                        <Select
                            label="Assigned Section"
                            options={[
                                { label: "Select Section", value: "" },
                                ...availableSections.map((secByC: string) => ({
                                    label: `Section ${secByC}`,
                                    value: secByC
                                }))
                            ]}
                            {...register("section")}
                            disabled={!selectedClass}
                            error={errors.section?.message}
                        />
                    </div>
                </div>

                {/* Section: Transport */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-6 bg-orange-500 rounded-full" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Transport</h3>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Uses Transport</label>
                            <p className="text-[10px] text-zinc-400 ml-1 mt-1">Enable to select transport destination</p>
                        </div>
                        <Switch
                            checked={watch("usesTransport")}
                            onCheckedChange={(checked) => setValue("usesTransport", checked)}
                        />
                    </div>
                    {watch("usesTransport") && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Transport Destination</label>
                            <select
                                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                {...register("transportDestinationId")}
                            >
                                <option value="">Select destination</option>
                                {transportDestinations?.map((dest: any) => (
                                    <option key={dest._id} value={dest._id}>
                                        {dest.destinationName} (₹{dest.monthlyFee}/month)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Section: Fee at Admission */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-6 bg-teal-500 rounded-full" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Fee at Admission <span className="text-zinc-400 normal-case">(optional)</span></h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Initial Deposit Amount</label>
                            <Input
                                {...register("initialDepositAmount", {
                                    onChange: (e) => {
                                        setDepositManuallyEdited(true);
                                        if (e?.target?.value === "") {
                                            setValue("initialDepositAmount", 0, {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            });
                                        }
                                    },
                                })}
                                type="number"
                                placeholder="0"
                                min="0"
                                className="h-10 rounded-xl border-gray-200 bg-white"
                            />
                            {suggestedInitialDeposit > 0 && (
                                <p className="text-[10px] text-zinc-500 ml-1">
                                    Suggested one-time total: ₹{suggestedInitialDeposit.toLocaleString("en-IN")}{" "}
                                    <span className="text-zinc-400">(all one-time fees for this session)</span>
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Payment Mode</label>
                            <select
                                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                {...register("depositPaymentMode")}
                            >
                                <option value="">Select mode</option>
                                <option value="cash">Cash</option>
                                <option value="upi">UPI/QR Code</option>
                                <option value="online">Online Transfer</option>
                                <option value="cheque">Cheque</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    {/* Concession: fixed + % of annual recurring (monthly) fees only */}
                    <div className="space-y-2">
                        <p className="text-[10px] text-zinc-400 ml-1 normal-case">
                            Concessions apply only to <span className="font-medium text-zinc-500">monthly</span> fees. One-time admission fees are unchanged.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                    Concession amount{" "}
                                    <span className="text-zinc-400 normal-case font-normal">(₹ / year off monthly total)</span>
                                </label>
                                <Input
                                    {...register("concessionAmount")}
                                    type="number"
                                    step={1}
                                    placeholder="0"
                                    min="0"
                                    className="h-10 rounded-xl border-gray-200 bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                    Concession %{" "}
                                    <span className="text-zinc-400 normal-case font-normal">(of annual monthly fees)</span>
                                </label>
                                <Input
                                    {...register("concessionPercent")}
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    className="h-10 rounded-xl border-gray-200 bg-white"
                                />
                            </div>
                        </div>
                        {concessionBreakdown ? (
                            <div className="mt-1 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[11px] text-amber-800 space-y-1">
                                <p className="font-semibold text-amber-900">Fee breakdown after concession</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                                    <span className="text-zinc-500 font-medium">Total fee</span>
                                    <span className="font-medium">
                                        ₹{concessionBreakdown.totalBeforeConcession.toLocaleString("en-IN")}
                                    </span>
                                    {concessionBreakdown.annualTransport > 0 ? (
                                        <>
                                            <span className="text-zinc-500">
                                                Bus fee
                                                {concessionBreakdown.transportDestinationName
                                                    ? ` (${concessionBreakdown.transportDestinationName})`
                                                    : ""}
                                                {` (${concessionBreakdown.busChargeableMonths} mo.)`}
                                            </span>
                                            <span className="font-medium">
                                                ₹{concessionBreakdown.annualTransport.toLocaleString("en-IN")}
                                            </span>
                                        </>
                                    ) : null}
                                    {concessionBreakdown.totalConcession > 0 ? (
                                        <>
                                            <span className="text-zinc-500">Concession</span>
                                            <span className="font-semibold text-red-700">
                                                − ₹{concessionBreakdown.totalConcession.toLocaleString("en-IN")}
                                            </span>
                                        </>
                                    ) : null}
                                    <span className="text-zinc-500 border-t border-amber-200 pt-1 font-medium">
                                        After concession total fee
                                    </span>
                                    <span className="font-bold text-indigo-700 border-t border-amber-200 pt-1">
                                        ₹{concessionBreakdown.newTotalYearly.toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-zinc-500">Fee paid during admission</span>
                                    <span className="font-medium text-teal-700">
                                        ₹{Math.max(0, Math.min(concessionBreakdown.newTotalYearly, depositAmount || 0)).toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-zinc-500 border-t border-amber-200 pt-1 font-medium">Left fee now</span>
                                    <span className="font-bold text-orange-700 border-t border-amber-200 pt-1">
                                        ₹{Math.max(0, concessionBreakdown.newTotalYearly - Math.max(0, Math.min(concessionBreakdown.newTotalYearly, depositAmount || 0))).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                        ) : (concessionAmount > 0 || concessionPercent > 0) && !feeStructure ? (
                            <p className="text-[10px] text-zinc-400 ml-1">Select a class first to see the adjusted fee breakdown.</p>
                        ) : null}
                    </div>

                    {/* QR Code Section - Dynamic */}
                    {(paymentMode === "upi" || paymentMode === "online") && depositAmount > 0 && (
                        <div className="mt-4 p-6 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col items-center gap-4 transition-all animate-in fade-in slide-in-from-top-4">
                            {status === "IDLE" && (
                                <Button
                                    type="button"
                                    onClick={handleGenerateQR}
                                    className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl px-8 h-12 font-bold shadow-lg flex items-center gap-2"
                                >
                                    <QrCode className="h-5 w-5" /> Generate PhonePe QR
                                </Button>
                            )}

                            {status === "GENERATING" && (
                                <div className="flex flex-col items-center gap-3 py-6">
                                    <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Securing Payment Channel...</p>
                                </div>
                            )}

                            {(status === "WAITING" || status === "COMPLETED" || status === "FAILED") && qrData && (
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`p-4 rounded-3xl bg-white shadow-xl border-2 transition-colors ${status === "COMPLETED" ? "border-emerald-500" : "border-zinc-100"}`}>
                                        <QRCodeSVG value={qrData} size={180} />
                                    </div>

                                    <div className="text-center">
                                        {status === "WAITING" && (
                                            <>
                                                <p className="text-sm font-bold text-zinc-800">Scan to Pay ₹{depositAmount}</p>
                                                <div className="flex items-center justify-center gap-2 mt-2">
                                                    <RefreshCw className="h-3 w-3 text-purple-500 animate-spin" />
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Waiting for payment confirmation...</p>
                                                </div>
                                            </>
                                        )}
                                        {status === "COMPLETED" && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                </div>
                                                <p className="text-sm font-bold text-emerald-700">Payment Verified Successfully</p>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Transaction ID: {merchantTransactionId?.slice(-8)}</p>
                                            </div>
                                        )}
                                        {status === "FAILED" && (
                                            <div className="flex flex-col items-center gap-1">
                                                <XCircle className="h-8 w-8 text-red-500 mb-1" />
                                                <p className="text-sm font-bold text-red-700">Payment Verification Failed</p>
                                                <Button variant="link" onClick={handleGenerateQR} className="text-purple-600 text-[10px] font-bold uppercase tracking-widest">Try Again</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <p className="text-[10px] text-zinc-400 text-center max-w-50">
                                This QR is dynamic and valid for this session only. Do not refresh the page.
                            </p>
                        </div>
                    )}
                </div>

                {/* Section: Document Submission */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-6 bg-emerald-500 rounded-full" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Document Status</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => setValue("tcSubmitted", !isTcChecked)}
                            className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${isTcChecked ? 'bg-emerald-50 border-emerald-200' : 'border border-dashed border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <FileCheck className={`h-5 w-5 ${isTcChecked ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                <span className={`text-xs font-bold ${isTcChecked ? 'text-white' : 'text-zinc-400'}`}>TC Accepted</span>
                            </div>
                            <CheckCircle2 className={`h-4 w-4 ${isTcChecked ? 'text-emerald-400' : 'text-zinc-800'}`} />
                        </div>

                        <div
                            onClick={() => setValue("migrationSubmitted", !isMigrationChecked)}
                            className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${isMigrationChecked ? 'bg-emerald-50 border-emerald-200' : 'border border-dashed border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <FileCheck className={`h-5 w-5 ${isMigrationChecked ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                <span className={`text-xs font-bold ${isMigrationChecked ? 'text-white' : 'text-zinc-400'}`}>Migration Received</span>
                            </div>
                            <CheckCircle2 className={`h-4 w-4 ${isMigrationChecked ? 'text-emerald-400' : 'text-zinc-800'}`} />
                        </div>
                    </div>
                </div>

                {/* Section: Residency */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-6 bg-amber-500 rounded-full" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Address Details</h3>
                    </div>
                    <div className="space-y-2">
                        <Input {...register("address.street")} placeholder="Building, Lane or Landmark" className="h-10 rounded-xl border-gray-200 bg-white" />
                        {errors.address?.street && <p className="text-[10px] text-red-400 ml-1">{errors.address.street.message}</p>}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Input {...register("address.city")} placeholder="City" className="h-10 rounded-xl border-gray-200 bg-white" />
                        </div>
                        <div className="space-y-1">
                            <Input {...register("address.state")} placeholder="State" className="h-10 rounded-xl border-gray-200 bg-white" />
                        </div>
                        <div className="space-y-1">
                            <Input {...register("address.pincode")} placeholder="Zip Code" className="h-10 rounded-xl border-gray-200 bg-white" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-6 pb-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="h-11 flex-1 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
                    >
                        Discard
                    </Button>
                    <Button
                        type="submit"
                        disabled={mutation.isPending || (["upi", "online"].includes(paymentMode || "") && depositAmount > 0 && status !== "COMPLETED")}
                        className={`h-14 flex-2 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all ${status === "COMPLETED" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" : "bg-purple-600 hover:bg-purple-500 shadow-purple-500/20"}`}
                    >
                        {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <div className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                {status === "COMPLETED" ? "Finalize Enrollment" : (["upi", "online"].includes(paymentMode || "") && depositAmount > 0 ? "Pending Payment..." : "Finalize Enrollment")}
                            </div>
                        )}
                    </Button>
                </div>
            </form>
            </Modal>

            {/* Success Modal */}
            {registeredStudent && (
                <StudentRegistrationSuccess
                    student={registeredStudent}
                    onClose={handleSuccessClose}
                />
            )}
        </>
    );
}
