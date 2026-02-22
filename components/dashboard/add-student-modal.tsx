"use client";

import { useState } from "react";
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
import {
    Loader2,
    UserPlus,
    Camera,
    CheckCircle2,
    FileCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const studentSchema = z.object({
    firstName: z.string().min(2, "First name required"),
    lastName: z.string().min(2, "Last name required"),
    fatherName: z.string().min(2, "Father name required"),
    motherName: z.string().min(2, "Mother name required"),
    dateOfBirth: z.string().min(1, "DOB required"),
    gender: z.enum(["Male", "Female", "Other"]),
    class: z.string().min(1, "Class required"),
    section: z.string().min(1, "Section required"),
    phone: z.string().min(10, "Valid phone needed"),
    photo: z.string().optional(),
    tcSubmitted: z.boolean().default(false),
    migrationSubmitted: z.boolean().default(false),
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
    const [selectedClass, setSelectedClass] = useState("");

    const { data: classes } = useQuery({
        queryKey: ["classes-list"],
        queryFn: async () => {
            const res = await api.get("/classes");
            return res.data.data ?? [];
        },
        enabled: isOpen,
    });

    const selectedClassData = Array.isArray(classes)
        ? classes.find((c: any) => c.className === selectedClass)
        : null;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<StudentValues>({
        resolver: zodResolver(studentSchema) as Resolver<StudentValues>,
        defaultValues: {
            gender: "Male",
            tcSubmitted: false,
            migrationSubmitted: false,
            address: {
                state: "Rajasthan",
                city: "Jaipur"
            }
        }
    });

    const isTcChecked = watch("tcSubmitted");
    const isMigrationChecked = watch("migrationSubmitted");

    const mutation = useMutation({
        mutationFn: (data: StudentValues) => api.post("/students", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success("Student Enrolled", {
                description: "The student record has been saved to the database."
            });
            reset();
            setPhotoPreview(null);
            onClose();
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

    const onSubmit: SubmitHandler<StudentValues> = (data) => {
        mutation.mutate(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Student Enrollment"
            description="Complete the registration by providing personal and document details."
            className="max-w-3xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-h-[75vh] overflow-y-auto px-1 pr-4 scrollbar-hide">

                {/* Section: Profile Image */}
                <div className="flex flex-col items-center gap-4 py-4 bg-white/[0.02] border border-white/5 rounded-3xl">
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">First Name</label>
                            <Input {...register("firstName")} placeholder="John" className="h-10 rounded-xl border-gray-200 bg-white" />
                            {errors.firstName && <p className="text-[10px] text-red-400 ml-1">{errors.firstName.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Last Name</label>
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
                </div>

                {/* Section: Academic Assignment */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-6 bg-blue-500 rounded-full" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Academic Scope</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Target Class</label>
                            <select 
                                className="h-10 w-full rounded-xl border-gray-200 bg-white px-3 text-sm"
                                {...register("class")}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setValue("class", e.target.value);
                                    setValue("section", "");
                                }}
                            >
                                <option value="">Select Class</option>
                                {Array.isArray(classes) && classes.map((cls: any) => (
                                    <option key={cls._id} value={cls.className}>
                                        Class {cls.className}
                                    </option>
                                ))}
                            </select>
                            {errors.class && <p className="text-[10px] text-red-400 ml-1">{errors.class.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Assigned Section</label>
                            <select 
                                className="h-10 w-full rounded-xl border-gray-200 bg-white px-3 text-sm"
                                {...register("section")}
                                disabled={!selectedClass}
                            >
                                <option value="">Select Section</option>
                                {selectedClassData?.sections?.map((sec: string) => (
                                    <option key={sec} value={sec}>
                                        Section {sec}
                                    </option>
                                ))}
                            </select>
                            {errors.section && <p className="text-[10px] text-red-400 ml-1">{errors.section.message}</p>}
                        </div>
                    </div>
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
                        disabled={mutation.isPending}
                        className="h-14 flex-[2] bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-transform"
                    >
                        {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <div className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4" /> Finalize Enrollment
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
