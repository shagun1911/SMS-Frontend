import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Activity {
    id: string | number;
    event: string;
    description: string;
    time: string;
    type?: string;
}

export function RecentActivity({
    className,
    activities
}: {
    className?: string;
    activities?: Activity[];
}) {
    if (!activities || activities.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
                No recent activity recorded.
            </div>
        );
    }

    return (
        <div className={cn("space-y-8", className)}>
            {activities.map((activity) => (
                <div key={activity.id} className="flex items-center">
                    <div className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white/10",
                        activity.type === 'system' ? 'bg-blue-500/10 text-blue-400' :
                            activity.type === 'infra' ? 'bg-emerald-500/10 text-emerald-400' :
                                'bg-zinc-800 text-zinc-400'
                    )}>
                        {activity.event.charAt(0)}
                    </div>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none text-white">{activity.event}</p>
                        <p className="text-sm text-zinc-500">
                            {activity.description}
                        </p>
                    </div>
                    <div className="ml-auto text-xs font-medium text-zinc-600">{activity.time}</div>
                </div>
            ))}
        </div>
    );
}
