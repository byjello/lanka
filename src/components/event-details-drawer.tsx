import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Event } from "@/types/database";
import { format, differenceInMinutes, addDays } from "date-fns";
import {
  MapPin,
  Clock,
  User,
  X,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useEvents } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";
import { usePrivy } from "@privy-io/react-auth";
import confetti from "canvas-confetti";
import { AttendeesListDrawer } from "./attendees-list-drawer";

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
  const { user, authenticated } = usePrivy();
  const [host, setHost] = useState<{ display_name: string } | null>(null);
  const { toggleAttendance, isAttending } = useEvents();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

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

  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);

  // If end time is before start time, assume it's the next day
  const adjustedEndTime = endTime < startTime ? addDays(endTime, 1) : endTime;
  const durationInMinutes = differenceInMinutes(adjustedEndTime, startTime);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }
    return `${hours} ${
      hours === 1 ? "hour" : "hours"
    } ${remainingMinutes} minutes`;
  };

  const handleAttendance = async () => {
    if (!event || !authenticated) return;

    setIsSubmitting(true);
    try {
      const wasAttending = isAttending(event);
      await toggleAttendance(event.id);

      if (!wasAttending) {
        // Show confetti and attending toast
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast({
          title: "You're going! 🪩 🪩 🪩 🪩 🪩",
          description: "We can't wait to see you there!",
        });
      } else {
        // Show cancellation toast
        toast({
          title: "Maybe next time 😢 😢 😢 😢 😢",
          description: "You've cancelled your attendance",
          variant: "destructive",
        });
      }

      // Close the drawer
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
                <p className="font-medium">
                  {format(startTime, "EEEE, MMMM d")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                  {" · "}
                  {formatDuration(durationInMinutes)}
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
            {event.location && event.location_name && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <a
                    href={event.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {event.location_name}
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttendees(true);
                }}
                className="text-sm text-primary hover:underline underline-offset-4 transition-colors"
              >
                {event?.attendees?.length || 0} people attending
              </button>
              <Button
                onClick={handleAttendance}
                variant={isAttending(event) ? "outline" : "default"}
                disabled={!authenticated || isSubmitting}
                className="min-w-[80px]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
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

      {event && (
        <AttendeesListDrawer
          isOpen={showAttendees}
          onClose={() => setShowAttendees(false)}
          attendees={event.attendees || []}
        />
      )}
    </>
  );
}
