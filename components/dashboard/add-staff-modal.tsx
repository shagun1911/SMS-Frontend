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

const staffSchema = z.object({
    name: z.string().min(3, "Full name required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Valid phone needed"),
    role: z.enum([
        UserRole.TEACHER,
        UserRole.ACCOUNTANT,
        UserRole.TRANSPORT_MANAGER,
        UserRole.SCHOOL_ADMIN,
    ]),
    baseSalary: z.string().min(1, "Base salary required"),
    joiningDate: z.string().min(1, "Joining date required"),
    subject: z.string().optional(),
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
        }
    });

    const selectedRole = watch("role");

    useEffect(() => {
        if (selectedRole === UserRole.SCHOOL_ADMIN) {
            setValue("baseSalary", "0");
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
        mutationFn: (data: StaffValues) => api.post("/users", {
            ...data,
            baseSalary: Number(data.baseSalary),
            joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : undefined,
            ...(photoUrl ? { photo: photoUrl } : {}),
        }),
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
            description="Enter professional details and payroll baseline for the new member."
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
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Full Name</label>
                    <Input {...register("name")} placeholder="Prof. Jane Cooper" className="h-11 rounded-xl border-gray-200 bg-white" />
                    {errors.name && <p className="text-[10px] text-red-400 ml-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Email Address</label>
                        <Input {...register("email")} placeholder="jane@school.edu" className="h-11 rounded-xl border-gray-200 bg-white" />
                        {errors.email && <p className="text-[10px] text-red-400 ml-1">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Phone Number</label>
                        <Input {...register("phone")} placeholder="+91 88888 88888" className="h-11 rounded-xl border-gray-200 bg-white" />
                        {errors.phone && <p className="text-[10px] text-red-400 ml-1">{errors.phone.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Member Role"
                        options={[
                            { label: "Teacher", value: UserRole.TEACHER },
                            { label: "Accountant", value: UserRole.ACCOUNTANT },
                            { label: "Transport Manager", value: UserRole.TRANSPORT_MANAGER },
                            { label: "School Admin", value: UserRole.SCHOOL_ADMIN },
                        ]}
                        {...register("role")}
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Base Salary (Monthly)</label>
                        <Input
                            {...register("baseSalary")}
                            type="number"
                            placeholder="₹ 0.00"
                            disabled={selectedRole === UserRole.SCHOOL_ADMIN}
                            value={selectedRole === UserRole.SCHOOL_ADMIN ? "0" : undefined}
                            className={`h-11 rounded-xl border-gray-200 bg-white ${selectedRole === UserRole.SCHOOL_ADMIN ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                        {selectedRole === UserRole.SCHOOL_ADMIN && (
                            <p className="text-[10px] text-muted-foreground ml-1">Payroll is not generated for school admins</p>
                        )}
                        {errors.baseSalary && selectedRole !== UserRole.SCHOOL_ADMIN && <p className="text-[10px] text-red-400 ml-1">{errors.baseSalary.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Joining Date</label>
                    <Input {...register("joiningDate")} type="date" className="h-11 rounded-xl border-gray-200 bg-white" />
                    {errors.joiningDate && <p className="text-[10px] text-red-400 ml-1">{errors.joiningDate.message}</p>}
                </div>

                {selectedRole === UserRole.TEACHER && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Primary Subject / Specialization</label>
                        <Input {...register("subject")} placeholder="Mathematics, Physics, etc." className="h-11 rounded-xl border-gray-200 bg-white" />
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
