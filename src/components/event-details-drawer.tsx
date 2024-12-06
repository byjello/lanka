import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Event } from "@/types/database";
import { format } from "date-fns";
import { MapPin, Clock, User, X, ExternalLink, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useEvents } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";

interface EventDetailsDrawerProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailsDrawer({
  event,
  isOpen,
  onClose,
}: EventDetailsDrawerProps) {
  const [host, setHost] = useState<{ display_name: string } | null>(null);
  const { toggleAttendance, isAttending } = useEvents();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchHost = async () => {
      if (!event) return;

      const { data } = await supabase
        .from("users")
        .select("display_name")
        .eq("privy_id", event.privy_user_id)
        .single();

      if (data) {
        setHost(data);
      }
    };

    fetchHost();
  }, [event]);

  if (!event) return null;

  const eventDate = new Date(event.start_time);
  const endTime = new Date(eventDate.getTime() + event.duration * 60000);

  const handleAttendanceToggle = async () => {
    if (!event) return;
    setIsUpdating(true);
    try {
      await toggleAttendance(event.id);
      const action = isAttending(event) ? "left" : "joined";
      toast({
        description: `Successfully ${action} event`,
        className: isAttending(event)
          ? undefined
          : "bg-green-50 border-green-200",
      });
      onClose();
    } catch (error) {
      toast({
        description: "Failed to update attendance",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{event.vibe || "🎯"}</span>
              <DrawerTitle className="text-xl font-semibold">
                {event.title}
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-6">
          {/* Time Details */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{format(eventDate, "EEEE, MMMM d")}</p>
              <p className="text-sm text-muted-foreground">
                {format(eventDate, "h:mm a")} - {format(endTime, "h:mm a")}
                {" · "}
                {event.duration} minutes
              </p>
            </div>
          </div>

          {/* Host Details */}
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Hosted by</p>
              <p className="font-medium">
                {host?.display_name || "Loading..."}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <a
                  href={event.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  View on Google Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-2">
              <h3 className="font-medium">About this event</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {event.attendees?.length || 0} people attending
            </p>
            <Button
              onClick={handleAttendanceToggle}
              variant={isAttending(event) ? "outline" : "default"}
              disabled={isUpdating}
              className="min-w-[100px]"
            >
              {isUpdating ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
              ) : isAttending(event) ? (
                "Cancel"
              ) : (
                "Attend"
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
