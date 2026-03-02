"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { toast } from "sonner";
import {
    Loader2,
    Building2,
    User,
    MapPin,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/lib/api";

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

interface AddSchoolModalProps {
    onSuccess: () => void;
}

export function AddSchoolModal({ onSuccess }: AddSchoolModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        trigger,
        reset,
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
            toast.success("School Registered successfully!");
            setOpen(false);
            reset();
            setStep(1);
            onSuccess();
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message;
            toast.error(msg || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                reset();
                setStep(1);
            }
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500">
                    <Plus className="h-4 w-4" /> Add School
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-indigo-600" />
                        Onboard New School
                    </DialogTitle>
                    <div className="mt-4 flex items-center gap-4">
                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 1 ? "bg-indigo-600" : "bg-gray-100"}`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 2 ? "bg-indigo-600" : "bg-gray-100"}`} />
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-6">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 border-b pb-2">
                                <Building2 className="h-4 w-4 text-indigo-500" />
                                School Information
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500 uppercase">School Name</label>
                                    <Input {...register("school.schoolName")} placeholder="e.g. Green Valley Public School" />
                                    {errors.school?.schoolName && <p className="text-[10px] text-red-500">{errors.school.schoolName.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500 uppercase">School Code</label>
                                    <Input {...register("school.schoolCode")} placeholder="e.g. GVPS01" />
                                    {errors.school?.schoolCode && <p className="text-[10px] text-red-500">{errors.school.schoolCode.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Official Email</label>
                                    <Input {...register("school.email")} type="email" placeholder="contact@school.com" />
                                    {errors.school?.email && <p className="text-[10px] text-red-500">{errors.school.email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Phone</label>
                                    <Input {...register("school.phone")} placeholder="+91 00000 00000" />
                                    {errors.school?.phone && <p className="text-[10px] text-red-500">{errors.school.phone.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                    <MapPin className="h-3.5 w-3.5" />
                                    Address
                                </div>
                                <Input {...register("school.address.street")} placeholder="Street Address" />
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <Input {...register("school.address.city")} placeholder="City" />
                                    <Input {...register("school.address.state")} placeholder="State" />
                                    <Input {...register("school.address.pincode")} placeholder="Pincode" />
                                    <Input {...register("school.address.country")} placeholder="Country" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Principal Name</label>
                                    <Input {...register("school.principalName")} placeholder="Principal Name" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Board</label>
                                    <select {...register("school.board")} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20">
                                        <option value="CBSE">CBSE</option>
                                        <option value="ICSE">ICSE</option>
                                        <option value="RBSE">RBSE</option>
                                        <option value="State Board">State Board</option>
                                    </select>
                                </div>
                            </div>

                            <Button type="button" onClick={nextStep} className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold">
                                Next: Setup Admin Account
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 border-b pb-2">
                                <User className="h-4 w-4 text-indigo-500" />
                                Administrative Account
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Full Name</label>
                                    <Input {...register("admin.name")} placeholder="Admin Full Name" />
                                    {errors.admin?.name && <p className="text-[10px] text-red-500">{errors.admin.name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Email (Login Username)</label>
                                    <Input {...register("admin.email")} placeholder="admin@example.com" />
                                    {errors.admin?.email && <p className="text-[10px] text-red-500">{errors.admin.email.message}</p>}
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 uppercase">Mobile</label>
                                        <Input {...register("admin.phone")} placeholder="Phone Number" />
                                        {errors.admin?.phone && <p className="text-[10px] text-red-500">{errors.admin.phone.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 uppercase">Password</label>
                                        <Input {...register("admin.password")} type="password" placeholder="••••••••" />
                                        {errors.admin?.password && <p className="text-[10px] text-red-500">{errors.admin.password.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1 font-semibold">
                                    Back
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 font-semibold text-white">
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Complete Onboarding
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
