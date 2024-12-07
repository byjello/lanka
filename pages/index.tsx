import type { NextPage } from "next";
import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { CreateEventDrawer } from "@/components/create-event-drawer";
import { useEvents } from "@/hooks/useEvents";
import { format, isSameDay, startOfDay, isAfter } from "date-fns";
import { Event } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { EventDetailsDrawer } from "@/components/event-details-drawer";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";

interface Filters {
  date?: Date;
  vibe?: string;
  timeOfDay?: "morning" | "afternoon" | "evening";
  attending?: boolean;
}

interface UserData {
  display_name: string;
  privy_id: string;
}

const START_DATE = new Date("2024-12-29");
const VIBES = [
  "🌴",
  "🧘‍♀️",
  "🏄‍♂️",
  "🏃‍♂️",
  "🎨",
  "🍛",
  "🥥",
  "🍜",
  "🍺",
  "🫖",
  "🎉",
];

const Home: NextPage = () => {
  const { authenticated, user } = usePrivy();
  const { events, isLoading, isAttending } = useEvents();
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, UserData>>({});

  // Fetch user data for event creators
  useEffect(() => {
    const fetchUsers = async () => {
      if (!events) return;

      // Get unique creator IDs
      const uniqueUserIds = [
        ...new Set(events.map((event) => event.privy_user_id)),
      ];

      if (uniqueUserIds.length === 0) return;

      // Fetch user data
      const { data } = await supabase
        .from("users")
        .select("privy_id, display_name")
        .in("privy_id", uniqueUserIds);

      if (data) {
        // Create a map of privy_id to user data
        const userMapping = data.reduce(
          (acc, user) => ({
            ...acc,
            [user.privy_id]: user,
          }),
          {} as Record<string, UserData>
        );

        setUserMap(userMapping);
      }
    };

    fetchUsers();
  }, [events]);

  // Group and filter events
  const getFilteredAndGroupedEvents = () => {
    if (!events) return new Map();

    let filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.start_time);
      const eventHour = eventDate.getHours();

      // Filter by date
      if (filters.date && !isSameDay(eventDate, filters.date)) return false;

      // Filter by vibe
      if (filters.vibe && event.vibe !== filters.vibe) return false;

      // Filter by time of day
      if (filters.timeOfDay) {
        if (filters.timeOfDay === "morning" && eventHour >= 12) return false;
        if (
          filters.timeOfDay === "afternoon" &&
          (eventHour < 12 || eventHour >= 17)
        )
          return false;
        if (filters.timeOfDay === "evening" && eventHour < 17) return false;
      }

      // Filter by attending
      if (filters.attending && user && !isAttending(event)) return false;

      // Only show events after START_DATE
      return isAfter(eventDate, startOfDay(START_DATE));
    });

    // Sort by date
    filteredEvents.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    // Group by date
    const grouped = new Map<string, Event[]>();
    filteredEvents.forEach((event) => {
      const dateKey = format(new Date(event.start_time), "yyyy-MM-dd");
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    });

    return grouped;
  };

  const groupedEvents = getFilteredAndGroupedEvents();

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header with Filters Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                    {Object.keys(filters).length}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filter Events</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 py-2 space-y-6">
                {/* Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.date
                          ? format(filters.date, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.date}
                        onSelect={(date) => setFilters((f) => ({ ...f, date }))}
                        disabled={(date) =>
                          date < START_DATE || date > new Date("2025-01-05")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Vibe Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vibe</label>
                  <Select
                    value={filters.vibe || "all"}
                    onValueChange={(vibe) =>
                      setFilters((f) => ({
                        ...f,
                        vibe: vibe === "all" ? undefined : vibe,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vibe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All vibes</SelectItem>
                      {VIBES.map((vibe) => (
                        <SelectItem key={vibe} value={vibe}>
                          <span className="flex items-center gap-2">
                            {vibe}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time of Day Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time of Day</label>
                  <Select
                    value={filters.timeOfDay || "all"}
                    onValueChange={(time) =>
                      setFilters((f) => ({
                        ...f,
                        timeOfDay:
                          time === "all"
                            ? undefined
                            : (time as Filters["timeOfDay"]),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any time</SelectItem>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Attending Filter */}
                {user && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Show Only</label>
                    <Select
                      value={filters.attending ? "attending" : "all"}
                      onValueChange={(value) =>
                        setFilters((f) => ({
                          ...f,
                          attending: value === "attending",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select events" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All events</SelectItem>
                        <SelectItem value="attending">
                          Events I'm attending
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DrawerFooter className="px-4 py-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setFilters({})}
                >
                  Clear Filters
                </Button>
                <DrawerClose asChild>
                  <Button className="w-full">Apply Filters</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {authenticated && (
          <Button onClick={() => setIsCreateDrawerOpen(true)} size="sm">
            Create Event
          </Button>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-8">
        {Array.from(groupedEvents.entries()).map(([dateKey, dayEvents]) => (
          <div key={dateKey}>
            {/* Date Separator */}
            <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-2 mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                {format(new Date(dateKey), "EEEE, MMMM d")}
              </h2>
            </div>

            {/* Day's Events */}
            <div className="space-y-4">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="group rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{event.vibe || "🎯"}</span>
                      <h3 className="font-medium text-sm sm:text-base">
                        {event.title}
                      </h3>
                    </div>
                    {user && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        {isAttending(event) ? (
                          <>
                            <Check className="h-3 w-3" />
                            Attending
                          </>
                        ) : (
                          <>
                            let's jiggle <ArrowRight className="h-3 w-3" />
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.start_time), "h:mm a")}
                      {" · "}
                      {event.duration} mins
                      {event.location_name && (
                        <>
                          {" · "}
                          <span>{event.location_name}</span>
                        </>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Hosted by{" "}
                      <span className="font-medium text-foreground">
                        {userMap[event.privy_user_id]?.display_name ||
                          "loading..."}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groupedEvents.size === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No events found
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

export default Home;
