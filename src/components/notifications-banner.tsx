import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  timestamp: string;
}

// Example notifications - in production, these would come from your database
const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Welcome to Season 1! 🎉",
    message: `
      <ul>
        <li>At by jello, there are no strangers, just friends you haven't met yet: introduce yourself and help create a warm, welcoming space. كل الناس خير وبركة ❤️</li><br>
        <li>Capture moments, not people's privacy: we have a no photos or videos policy on the dancefloor. Enjoy the moment with those around you.</li><br>
        <li>Take care of each other and the space: keep things easy and kind for everyone.</li><br>
        <li>Join in or add your own events: whether it's surfing, yoga, or a dinner, make the most of the community + co-creation!</li><br>
        <li>Watch out for the waves: the tide is stronger than it looks.</li><br>
        <li>Scooter safety: only drive a scooter if you know how, and always drive sober, roads can be chaotic.</li><br>
      </ul>
    `,
    type: "info",
    timestamp: "2024-12-21T00:00:00Z",
  },
];

export function NotificationsBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const hasUnread = true; // This would be managed by your notification system

  return (
    <div className="mb-6">
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={cn(
          "w-full rounded-lg shadow-sm transition-all duration-200 gap-2",
          hasUnread && "bg-primary/5 border-primary/20"
        )}
      >
        <Bell className="h-4 w-4" />
        <span className="text-sm">Announcements</span>
        {hasUnread && (
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
      </Button>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Announcements</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <div className="space-y-4">
              {NOTIFICATIONS.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    notification.type === "warning" &&
                      "bg-yellow-50/50 border-yellow-200",
                    notification.type === "success" &&
                      "bg-green-50/50 border-green-200",
                    notification.type === "info" &&
                      "bg-blue-50/50 border-blue-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{notification.title}</h3>
                      <p
                        className="text-sm text-muted-foreground mt-1"
                        dangerouslySetInnerHTML={{
                          __html: notification.message,
                        }}
                      />
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
