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
        <div className={cn("space-y-6", className)}>
            {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                    <div className={cn(
                        "h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-gray-200",
                        activity.type === 'system' ? 'bg-indigo-100 text-indigo-600' :
                            activity.type === 'infra' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-gray-100 text-gray-600'
                    )}>
                        {activity.event.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm font-medium leading-none text-gray-900 truncate">{activity.event}</p>
                        <p className="text-sm text-gray-500 truncate">
                            {activity.description}
                        </p>
                    </div>
                    <div className="shrink-0 text-xs text-gray-400">
                        {typeof activity.time === 'string' && activity.time.length > 10
                            ? new Date(activity.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                            : activity.time}
                    </div>
                </div>
            ))}
        </div>
    );
}
