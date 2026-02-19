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
        <div className="relative min-h-screen w-full overflow-y-auto bg-[hsl(var(--background))] py-12 px-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 via-transparent to-[hsl(var(--primary))]/10" />
            <div className="relative z-10 mx-auto w-full max-w-2xl">
                <Link
                    href="/"
                    className="mb-8 inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] transition-smooth hover:text-[hsl(var(--primary))]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to Home</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">Onboard your Institution</h1>
                    <p className="mt-2 text-[hsl(var(--muted-foreground))]">Join the SMS network and modernize your school operations.</p>
                    <div className="mt-8 flex items-center gap-4">
                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 1 ? "bg-primary" : "bg-[hsl(var(--border))]"}`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 2 ? "bg-primary" : "bg-[hsl(var(--border))]"}`} />
                    </div>
                </div>

                <div className="space-y-8 rounded-2xl border border-[hsl(var(--border))] bg-white p-8 shadow-xl md:p-12">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {step === 1 ? (
                            <div className="animate-fade-in space-y-6">
                                <div className="mb-6 flex items-center gap-3">
                                    <Building2 className="h-6 w-6 text-primary" />
                                    <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">School Information</h2>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">School Name</label>
                                        <Input {...register("school.schoolName")} placeholder="Example Public School" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                        {errors.school?.schoolName && <p className="ml-1 text-xs text-destructive">{errors.school.schoolName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">School Code</label>
                                        <Input {...register("school.schoolCode")} placeholder="EPS2024" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                        {errors.school?.schoolCode && <p className="ml-1 text-xs text-destructive">{errors.school.schoolCode.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Official Email</label>
                                        <Input {...register("school.email")} type="email" placeholder="contact@example.edu" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                        {errors.school?.email && <p className="ml-1 text-xs text-destructive">{errors.school.email.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Phone</label>
                                        <Input {...register("school.phone")} placeholder="+91 99999 99999" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                        {errors.school?.phone && <p className="ml-1 text-xs text-destructive">{errors.school.phone.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm font-medium">Address</span>
                                    </div>
                                    <Input {...register("school.address.street")} placeholder="Street Address" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                        <Input {...register("school.address.city")} placeholder="City" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                        <Input {...register("school.address.state")} placeholder="State" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                        <Input {...register("school.address.pincode")} placeholder="Pincode" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                        <Input {...register("school.address.country")} placeholder="Country" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Principal Name</label>
                                        <Input {...register("school.principalName")} placeholder="Dr. John Doe" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Board</label>
                                        <select {...register("school.board")} className="h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]">
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="RBSE">RBSE</option>
                                            <option value="State Board">State Board</option>
                                        </select>
                                    </div>
                                </div>

                                <Button type="button" onClick={nextStep} className="mt-8 h-12 w-full font-semibold">
                                    Next: Admin Account Setup
                                </Button>
                            </div>
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="mb-6 flex items-center gap-3">
                                    <User className="h-6 w-6 text-primary" />
                                    <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Primary Administrative Account</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Full Name</label>
                                        <Input {...register("admin.name")} placeholder="Admin Name" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Email (Login)</label>
                                        <Input {...register("admin.email")} placeholder="admin@example.com" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Mobile</label>
                                            <Input {...register("admin.phone")} placeholder="+91 88888 88888" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="ml-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Password</label>
                                            <Input {...register("admin.password")} type="password" placeholder="••••••••" className="h-12 rounded-xl border-[hsl(var(--input))]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-4">
                                    <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1 font-semibold">
                                        Previous
                                    </Button>
                                    <Button type="submit" disabled={isLoading} className="flex-[2] font-semibold">
                                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Registration"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                    All registrations are subject to verification by Shagun Systems
                </p>
            </div>
        </div>
    );
}
