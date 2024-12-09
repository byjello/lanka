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
  AlertTriangle,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const { deleteEvent } = useEvents();

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

  const handleDeleteEvent = async () => {
    if (!event || !authenticated || !user || user.id !== event.privy_user_id)
      return;

    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      onClose();
      setShowDeleteWarning(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
            {event.location_name && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  {event.location ? (
                    <a
                      href={event.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {event.location_name}
                    </a>
                  ) : (
                    <p className="font-medium">{event.location_name}</p>
                  )}
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
              <div className="flex gap-2">
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
                {authenticated && user && user.id === event.privy_user_id && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteWarning(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Warning Drawer */}
      <Drawer open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <DrawerTitle className="text-lg font-semibold">
                Delete Event?
              </DrawerTitle>
            </div>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this event? This action cannot be
              undone.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteWarning(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete Event"
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
