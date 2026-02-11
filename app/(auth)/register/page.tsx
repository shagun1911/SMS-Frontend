"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
    ArrowLeft,
    Loader2,
    School,
    User,
    Building2,
    MapPin
} from "lucide-react";

// Validation Schema
const registerSchema = z.object({
    school: z.object({
        schoolName: z.string().min(3, "School name is required"),
        schoolCode: z.string().min(2, "Code is required").max(10),
        email: z.string().email("Invalid school email"),
        phone: z.string().min(10, "Valid phone needed"),
        principalName: z.string().min(3, "Principal name is required"),
        board: z.string().min(1, "Please select board"),
        address: z.object({
            street: z.string().min(1, "Street is required"),
            city: z.string().min(1, "City is required"),
            state: z.string().min(1, "State is required"),
            pincode: z.string().min(6, "Valid pincode needed"),
            country: z.string().min(1, "Country is required"),
        }),
        classRange: z.object({
            from: z.string().min(1, "Required"),
            to: z.string().min(1, "Required"),
        }),
    }),
    admin: z.object({
        name: z.string().min(3, "Admin name is required"),
        email: z.string().email("Invalid admin email"),
        password: z.string().min(6, "Password must be 6+ chars"),
        phone: z.string().min(10, "Valid phone needed"),
    }),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        trigger,
        formState: { errors },
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            school: {
                board: "CBSE",
                address: { country: "India", street: "", city: "", state: "", pincode: "" },
                classRange: { from: "Nursery", to: "12th" },
                schoolName: "",
                schoolCode: "",
                email: "",
                phone: "",
                principalName: ""
            },
            admin: {
                name: "",
                email: "",
                password: "",
                phone: ""
            }
        }
    });

    const nextStep = async () => {
        const isStepValid = await trigger("school");
        if (isStepValid) setStep(2);
    };

    const onSubmit: SubmitHandler<RegisterValues> = async (data) => {
        setIsLoading(true);
        try {
            await api.post("/schools/register", data);
            toast.success("School Registered!", {
                description: "Your institution has been onboarded. You can now login.",
            });
            router.push("/login?portal=school");
        } catch (error: any) {
            toast.error("Registration failed", {
                description: error.response?.data?.message || "Something went wrong",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-y-auto bg-[#0A0A0A] text-white py-12 px-4">
            {/* Background Glow */}
            <div className="fixed -top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

            <div className="relative z-10 mx-auto w-full max-w-2xl">
                <Link
                    href="/"
                    className="group mb-8 inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-medium">Back to Home</span>
                </Link>

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Onboard your Institution</h1>
                    <p className="text-zinc-400">Join the SSMS network and modernize your school operations.</p>

                    {/* Steps indicator */}
                    <div className="mt-8 flex items-center gap-4">
                        <div className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-purple-500' : 'bg-white/10'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-purple-500' : 'bg-white/10'}`} />
                    </div>
                </div>

                {/* Form Container */}
                <div className="space-y-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {step === 1 ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <Building2 className="h-6 w-6 text-purple-400" />
                                    <h2 className="text-xl font-semibold">School Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">School Name</label>
                                        <Input {...register("school.schoolName")} placeholder="Example Public School" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                        {errors.school?.schoolName && <p className="text-[10px] text-red-400 ml-1">{errors.school.schoolName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">School Code (Short)</label>
                                        <Input {...register("school.schoolCode")} placeholder="EPS2024" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                        {errors.school?.schoolCode && <p className="text-[10px] text-red-400 ml-1">{errors.school.schoolCode.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Official Email</label>
                                        <Input {...register("school.email")} type="email" placeholder="contact@example.edu" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                        {errors.school?.email && <p className="text-[10px] text-red-400 ml-1">{errors.school.email.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Phone Number</label>
                                        <Input {...register("school.phone")} placeholder="+91 99999 99999" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                        {errors.school?.phone && <p className="text-[10px] text-red-400 ml-1">{errors.school.phone.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm font-medium">Address Details</span>
                                    </div>
                                    <Input {...register("school.address.street")} placeholder="Street Address" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Input {...register("school.address.city")} placeholder="City" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                        <Input {...register("school.address.state")} placeholder="State" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                        <Input {...register("school.address.pincode")} placeholder="Pincode" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                        <Input {...register("school.address.country")} placeholder="Country" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Principal Name</label>
                                        <Input {...register("school.principalName")} placeholder="Dr. John Doe" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Affiliated Board</label>
                                        <select {...register("school.board")} className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-4 text-sm outline-none focus:ring-1 focus:ring-purple-500">
                                            <option value="CBSE" className="bg-zinc-900">CBSE</option>
                                            <option value="ICSE" className="bg-zinc-900">ICSE</option>
                                            <option value="RBSE" className="bg-zinc-900">RBSE</option>
                                            <option value="State Board" className="bg-zinc-900">State Board</option>
                                        </select>
                                    </div>
                                </div>

                                <Button type="button" onClick={nextStep} className="w-full h-14 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold mt-8 shadow-lg shadow-purple-500/20">
                                    Next: Admin Account Setup
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <User className="h-6 w-6 text-purple-400" />
                                    <h2 className="text-xl font-semibold">Primary Administrative Account</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Full Name</label>
                                        <Input {...register("admin.name")} placeholder="Admin Name" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Personal Email (Login Username)</label>
                                        <Input {...register("admin.email")} placeholder="admin@example.com" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Mobile number</label>
                                            <Input {...register("admin.phone")} placeholder="+91 88888 88888" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Secure Password</label>
                                            <Input {...register("admin.password")} type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <Button type="button" onClick={() => setStep(1)} variant="outline" className="h-14 flex-1 border-white/10 hover:bg-white/5 rounded-2xl font-bold">
                                        Previous
                                    </Button>
                                    <Button type="submit" disabled={isLoading} className="h-14 flex-[2] bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold shadow-lg shadow-purple-500/20">
                                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Registration"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <p className="mt-8 text-center text-zinc-600 text-[10px] tracking-[0.2em] uppercase font-bold">
                    All registrations are subject to verification by Shagun Systems
                </p>
            </div>
        </div>
    );
}
