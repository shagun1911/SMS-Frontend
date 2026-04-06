"use client";

import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, ShieldCheck, Camera, X } from "lucide-react";
import { UserRole } from "@/types";

function normalizePhoneDigitsInput(raw: string): string {
    let d = raw.replace(/\D/g, "");
    if (d.length >= 12 && d.startsWith("91")) {
        d = d.slice(-10);
    }
    if (d.length === 11 && d.startsWith("0")) {
        d = d.slice(1);
    }
    while (d.length > 15) {
        d = d.slice(-15);
    }
    return d;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const staffSchema = z
    .object({
        name: z.string().min(3, "Full name required"),
        email: z.string(),
        phone: z.string().min(1, "Phone number required"),
        role: z.enum([
            UserRole.TEACHER,
            UserRole.ACCOUNTANT,
            UserRole.TRANSPORT_MANAGER,
            UserRole.SCHOOL_ADMIN,
            UserRole.BUS_DRIVER,
            UserRole.CONDUCTOR,
            UserRole.CLEANING_STAFF,
            UserRole.STAFF_OTHER,
        ]),
        baseSalary: z.string(),
        joiningDate: z.string().min(1, "Joining date required"),
        subject: z.string().optional(),
        staffRoleTitle: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        const emailTrim = (data.email ?? "").trim();
        if (data.role === UserRole.SCHOOL_ADMIN) {
            if (!emailTrim) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Email is required for school admin accounts",
                    path: ["email"],
                });
            } else if (!emailPattern.test(emailTrim)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Invalid email address",
                    path: ["email"],
                });
            }
        } else if (emailTrim && !emailPattern.test(emailTrim)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid email address",
                path: ["email"],
            });
        }

        const raw = (data.phone ?? "").trim();
        const d = normalizePhoneDigitsInput(raw);
        if (d.length < 10 || d.length > 15) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Enter a valid phone number (10–15 digits)",
                path: ["phone"],
            });
        }

        if (data.role !== UserRole.SCHOOL_ADMIN) {
            const salaryRaw = String(data.baseSalary ?? "").trim();
            if (!salaryRaw) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Base salary required",
                    path: ["baseSalary"],
                });
            } else if (Number.isNaN(Number(salaryRaw))) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Enter a valid amount",
                    path: ["baseSalary"],
                });
            }
        }

        if (data.role === UserRole.STAFF_OTHER) {
            const t = (data.staffRoleTitle || "").trim();
            if (t.length < 2) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Enter the specific role",
                    path: ["staffRoleTitle"],
                });
            }
        }

        if (data.role === UserRole.TEACHER) {
            const s = (data.subject || "").trim();
            if (s.length < 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Primary subject is required for teachers",
                    path: ["subject"],
                });
            }
        }
    });

type StaffValues = z.infer<typeof staffSchema>;

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<StaffValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            role: UserRole.TEACHER,
            staffRoleTitle: "",
            name: "",
            email: "",
            phone: "",
            baseSalary: "",
            joiningDate: "",
            subject: "",
        },
    });

    const selectedRole = watch("role");

    useEffect(() => {
        if (selectedRole === UserRole.SCHOOL_ADMIN) {
            setValue("baseSalary", "0");
        }
        if (selectedRole !== UserRole.STAFF_OTHER) {
            setValue("staffRoleTitle", "");
        }
    }, [selectedRole, setValue]);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Local preview
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(file);

        // Upload to Cloudinary via backend
        setPhotoUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await api.post("/upload/image?folder=staff", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setPhotoUrl(res.data.data?.url ?? null);
            toast.success("Photo uploaded");
        } catch {
            toast.error("Photo upload failed — you can still save without a photo");
            setPhotoPreview(null);
            setPhotoUrl(null);
        } finally {
            setPhotoUploading(false);
        }
    };

    const removePhoto = () => {
        setPhotoPreview(null);
        setPhotoUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const mutation = useMutation({
        mutationFn: (data: StaffValues) => {
            const salaryRaw = String(data.baseSalary ?? "").trim();
            const baseSalary =
                data.role === UserRole.SCHOOL_ADMIN
                    ? 0
                    : Number(salaryRaw);
            const emailTrim = (data.email ?? "").trim();
            const body: Record<string, unknown> = {
                name: data.name.trim(),
                phone: data.phone.trim(),
                role: data.role,
                baseSalary,
                joiningDate: new Date(data.joiningDate).toISOString(),
                ...(photoUrl ? { photo: photoUrl } : {}),
            };
            if (data.role === UserRole.SCHOOL_ADMIN) {
                body.email = emailTrim.toLowerCase();
            } else if (emailTrim) {
                body.email = emailTrim.toLowerCase();
            }
            if (data.role === UserRole.TEACHER) {
                body.subject = (data.subject ?? "").trim();
            }
            if (data.role === UserRole.STAFF_OTHER) {
                body.staffRoleTitle = (data.staffRoleTitle || "").trim();
            }
            return api.post("/users", body);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff-list"] });
            toast.success("Staff Member Enrolled", {
                description: "New staff record with salary profile has been created."
            });
            reset();
            setPhotoPreview(null);
            setPhotoUrl(null);
            onClose();
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.response?.data?.error || error.message;
            const desc = msg && msg !== "Something went wrong" ? msg : "Check your connection and try again.";
            toast.error("Process Failed", { description: desc });
        }
    });

    const onSubmit = (data: StaffValues) => {
        mutation.mutate(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Register New Staff"
            description="All fields are required except email. Email is optional for most roles and required only when the member role is School Admin."
            className="max-w-lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Photo upload */}
                <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none"
                            disabled={photoUploading}
                        >
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-1 p-2">
                                    {photoUploading
                                        ? <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                                        : <Camera className="h-7 w-7 text-gray-400 group-hover:text-blue-400 transition" />
                                    }
                                    <span className="text-[10px] text-gray-400 text-center leading-tight">
                                        {photoUploading ? "Uploading…" : "Add Photo"}
                                    </span>
                                </div>
                            )}
                        </button>

                        {photoPreview && !photoUploading && (
                            <button
                                type="button"
                                onClick={removePhoto}
                                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">Click to upload photo (optional)</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoChange}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Full name</label>
                    <Input {...register("name")} placeholder="Prof. Jane Cooper" className="h-11 rounded-xl border-gray-200 bg-white" />
                    {errors.name && <p className="text-[10px] text-red-400 ml-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                            Email address{" "}
                            {selectedRole === UserRole.SCHOOL_ADMIN ? (
                                <span className="text-red-500">*</span>
                            ) : (
                                <span className="font-normal normal-case text-zinc-400">(optional)</span>
                            )}
                        </label>
                        <Input
                            {...register("email")}
                            type="email"
                            autoComplete="email"
                            placeholder="jane@school.edu"
                            className="h-11 rounded-xl border-gray-200 bg-white"
                        />
                        {errors.email && <p className="text-[10px] text-red-400 ml-1">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Phone number</label>
                        <Input {...register("phone")} placeholder="+91 88888 88888" className="h-11 rounded-xl border-gray-200 bg-white" />
                        {errors.phone && <p className="text-[10px] text-red-400 ml-1">{errors.phone.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Member role"
                        options={[
                            { label: "Teacher", value: UserRole.TEACHER },
                            { label: "Accountant", value: UserRole.ACCOUNTANT },
                            { label: "Transport Manager", value: UserRole.TRANSPORT_MANAGER },
                            { label: "Bus Driver", value: UserRole.BUS_DRIVER },
                            { label: "Conductor", value: UserRole.CONDUCTOR },
                            { label: "Cleaning Staff", value: UserRole.CLEANING_STAFF },
                            { label: "Others", value: UserRole.STAFF_OTHER },
                            { label: "School Admin", value: UserRole.SCHOOL_ADMIN },
                        ]}
                        {...register("role")}
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                            Base salary (monthly)
                        </label>
                        <Input
                            {...register("baseSalary")}
                            type="number"
                            placeholder="₹ 0.00"
                            disabled={selectedRole === UserRole.SCHOOL_ADMIN}
                            className={`h-11 rounded-xl border-gray-200 bg-white ${selectedRole === UserRole.SCHOOL_ADMIN ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                        {selectedRole === UserRole.SCHOOL_ADMIN && (
                            <p className="text-[10px] text-muted-foreground ml-1">Payroll is not generated for school admins</p>
                        )}
                        {errors.baseSalary && selectedRole !== UserRole.SCHOOL_ADMIN && <p className="text-[10px] text-red-400 ml-1">{errors.baseSalary.message}</p>}
                    </div>
                </div>

                {selectedRole === UserRole.STAFF_OTHER && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                            Specify role <span className="text-red-500">*</span>
                        </label>
                        <Input
                            {...register("staffRoleTitle")}
                            placeholder="e.g. Librarian, Security Guard"
                            className="h-11 rounded-xl border-gray-200 bg-white"
                        />
                        {errors.staffRoleTitle && (
                            <p className="text-[10px] text-red-400 ml-1">{errors.staffRoleTitle.message}</p>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Joining date</label>
                    <Input {...register("joiningDate")} type="date" className="h-11 rounded-xl border-gray-200 bg-white" />
                    {errors.joiningDate && <p className="text-[10px] text-red-400 ml-1">{errors.joiningDate.message}</p>}
                </div>

                {selectedRole === UserRole.TEACHER && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                            Primary subject / specialization <span className="text-red-500">*</span>
                        </label>
                        <Input {...register("subject")} placeholder="Mathematics, Physics, etc." className="h-11 rounded-xl border-gray-200 bg-white" />
                        {errors.subject && (
                            <p className="text-[10px] text-red-400 ml-1">{errors.subject.message}</p>
                        )}
                    </div>
                )}

                <div className="flex gap-4 pt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="h-11 flex-1 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={mutation.isPending || photoUploading}
                        className="h-14 flex-[2] bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
                    >
                        {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Create Profile
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
