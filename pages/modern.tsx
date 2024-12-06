import type { NextPage } from "next";
import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CreateEventDrawer } from "@/components/create-event-drawer";
import { useEvents } from "@/hooks/useEvents";
import { format, addDays, isSameDay } from "date-fns";
import { Event } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { EventDetailsDrawer } from "@/components/event-details-drawer";

const START_DATE = new Date("2024-12-29");
const DAYS_TO_SHOW = 8;

// Add interface for user data
interface UserData {
  display_name: string;
  id: string;
}

const Modern: NextPage = () => {
  const { authenticated } = usePrivy();
  const { events, isLoading } = useEvents();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, UserData>>({});
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Get the date for the current day index
  const getCurrentDate = () => addDays(START_DATE, currentDayIndex);

  // Filter events for the current day
  const getCurrentDayEvents = () => {
    if (!events) return [];
    const currentDate = getCurrentDate();
    return events
      .filter((event) => isSameDay(new Date(event.start_time), currentDate))
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
  };

  const formatEventTime = (event: Event) => {
    const startTime = new Date(event.start_time);
    const endTime = new Date(startTime.getTime() + event.duration * 60000);

    return `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;
  };

  const handleDayChange = (direction: "prev" | "next") => {
    setCurrentDayIndex((prevIndex) => {
      if (direction === "prev") {
        return prevIndex > 0 ? prevIndex - 1 : DAYS_TO_SHOW - 1;
      } else {
        return prevIndex < DAYS_TO_SHOW - 1 ? prevIndex + 1 : 0;
      }
    });
  };

  // Fetch user data for all event creators
  useEffect(() => {
    const fetchUsers = async () => {
      if (!events) return;

      const uniqueUserIds = [
        ...new Set(events.map((event) => event.privy_user_id)),
      ];

      const { data } = await supabase
        .from("users")
        .select("privy_id, display_name")
        .in("privy_id", uniqueUserIds);

      if (data) {
        const userMapping = data.reduce(
          (acc, user) => ({
            ...acc,
            [user.privy_id]: user,
          }),
          {}
        );
        setUserMap(userMapping);
      }
    };

    fetchUsers();
  }, [events]);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDayChange("prev")}
          >
            ←
          </Button>
          <h2 className="text-sm sm:text-xl font-medium text-muted-foreground">
            {format(getCurrentDate(), "eee, MMM d")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDayChange("next")}
          >
            →
          </Button>
        </div>
        {authenticated && (
          <Button
            onClick={() => setIsCreateDrawerOpen(true)}
            variant="default"
            size="sm"
            className="text-xs sm:text-sm"
          >
            Create Event
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {getCurrentDayEvents().map((event) => (
          <div
            key={event.id}
            className="group rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => setSelectedEvent(event)}
          >
            {/* Emoji and Title Row */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{event.vibe || "🎯"}</span>
              <h3 className="font-medium text-sm sm:text-base">
                {event.title}
              </h3>
            </div>

            {/* Time and Host Row */}
            <div className="space-y-1 mb-3">
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.start_time), "h:mm a")}
                {" · "}
                {event.duration} mins
              </p>
              <p className="text-sm text-muted-foreground">
                Hosted by{" "}
                <span className="font-medium text-foreground">
                  {userMap[event.privy_user_id]?.display_name || "loading..."}
                </span>
              </p>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="text-xs sm:text-sm text-primary hover:text-primary/80"
              >
                let's jiggle{" "}
                <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        ))}

        {getCurrentDayEvents().length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No events scheduled for this day
          </div>
        )}
      </div>

      <EventDetailsDrawer
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <CreateEventDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
      />
    </div>
  );
};

export default Modern;
