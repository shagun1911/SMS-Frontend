"use client";

import { useState } from "react";
import {
    Settings as SettingsIcon,
    Building2,
    Bell,
    Shield,
    Globe,
    Database,
    Smartphone,
    Mail,
    ChevronRight,
    Save,
    Image as ImageIcon,
    Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
    return (
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                    System Configuration
                </h2>
                <p className="text-muted-foreground mt-1">
                    Manage school identity, regional settings, and security preferences.
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/5 h-12 rounded-xl p-1 gap-1">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest">School Profile</TabsTrigger>
                    <TabsTrigger value="academic" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest">Academic</TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest">Alerts</TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="m-0 space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="md:col-span-2 border-white/5 bg-neutral-900/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                                <CardTitle className="text-xl font-bold uppercase tracking-tight">General Identity</CardTitle>
                                <CardDescription>Basic information visible on reports and invoices.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">School Name</Label>
                                        <Input defaultValue="ABC International Public School" className="bg-white/[0.02] border-white/10 h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">School Code / UDISE</Label>
                                        <Input defaultValue="ABC302911" className="bg-white/[0.02] border-white/10 h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Official Email</Label>
                                        <Input defaultValue="contact@abcschool.com" className="bg-white/[0.02] border-white/10 h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Phone Number</Label>
                                        <Input defaultValue="+91 98765 43210" className="bg-white/[0.02] border-white/10 h-11" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Address</Label>
                                    <Input defaultValue="Sec-14, Vidyut Nagar, Jaipur, Rajasthan 302021" className="bg-white/[0.02] border-white/10 h-11" />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button className="bg-zinc-100 text-black hover:bg-white font-bold gap-2 rounded-xl h-11 px-8">
                                        <Save className="h-4 w-4" /> Save Identity
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                                    <CardTitle className="text-lg font-bold uppercase tracking-tight">Branding</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 flex flex-col items-center">
                                    <div className="relative group">
                                        <Avatar className="h-32 w-32 border-2 border-white/10 ring-4 ring-white/5">
                                            <AvatarImage src="" />
                                            <AvatarFallback className="bg-zinc-800 text-zinc-500">
                                                <Building2 className="h-12 w-12" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <p className="mt-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center leading-relaxed">
                                        Max size: 2MB<br />Recommended: 512x512 PNG
                                    </p>
                                    <Button variant="outline" className="mt-6 w-full border-white/10 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest">
                                        <ImageIcon className="h-3.5 w-3.5" /> Replace Logo
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                                <div className="p-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-xs font-bold text-white uppercase tracking-tight">Auto-Tax Invoice</Label>
                                            <p className="text-[10px] text-zinc-500 font-medium">Generate GST bills automatically</p>
                                        </div>
                                        <Switch />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-xs font-bold text-white uppercase tracking-tight">Public Profile</Label>
                                            <p className="text-[10px] text-zinc-500 font-medium">Visible on school directory</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="notifications" className="m-0">
                    <Card className="border-white/5 bg-neutral-900/50 backdrop-blur-xl rounded-[2rem] overflow-hidden max-w-2xl">
                        <CardHeader className="p-8 border-b border-white/5">
                            <CardTitle className="text-xl font-bold uppercase tracking-tight">Notification Channels</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {[
                                { title: "SMS Alerts", desc: "Send fee reminders via SMS gateway", icon: Smartphone, enabled: true },
                                { title: "Email Broadcasts", desc: "Weekly academic performance reports", icon: Mail, enabled: true },
                                { title: "System Push", desc: "Internal dashboard notification alerts", icon: Bell, enabled: false },
                                { title: "Webhook Integration", desc: "Export data to external ERP systems", icon: Globe, enabled: false }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-8 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="bg-zinc-800 p-3 rounded-2xl">
                                            <item.icon className="h-5 w-5 text-zinc-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-tight">{item.title}</p>
                                            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked={item.enabled} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
