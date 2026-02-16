import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import AuthGuard from "@/components/auth/auth-guard";
import { AiChat } from "@/components/ai/ai-chat";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-gray-50">
                {/* Sidebar */}
                <div className="hidden w-64 shrink-0 border-r md:block">
                    <Sidebar className="h-full" />
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
            <AiChat />
        </AuthGuard>
    );
}
