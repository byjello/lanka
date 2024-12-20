import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserMetadata, Event } from "@/types/database";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { EventDetailsDrawer } from "@/components/event-details-drawer";

interface UserWithEvents extends UserMetadata {
  vibes?: string[];
}

interface UserEvents {
  hosting: Event[];
  attending: Event[];
}

export default function Directory() {
  const { authenticated, login } = usePrivy();
  const [users, setUsers] = useState<UserWithEvents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithEvents | null>(null);
  const [userEvents, setUserEvents] = useState<UserEvents>({
    hosting: [],
    attending: [],
  });
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .not("display_name", "is", null)
        .order("num_points", { ascending: false });

      if (data) {
        setUsers(data);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, []);

  // Fetch user's events when selected
  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!selectedUser) return;

      setIsLoadingEvents(true);

      // Fetch events they're hosting
      const { data: hostingData } = await supabase
        .from("events")
        .select("*")
        .eq("privy_user_id", selectedUser.privy_id)
        .gte("start_time", new Date().toISOString())
        .order("start_time");

      // Fetch events they're attending
      const { data: attendingData } = await supabase
        .from("events")
        .select("*")
        .contains("attendees", [selectedUser.privy_id])
        .neq("privy_user_id", selectedUser.privy_id) // Exclude events they're hosting
        .gte("start_time", new Date().toISOString())
        .order("start_time");

      setUserEvents({
        hosting: hostingData || [],
        attending: attendingData || [],
      });

      setIsLoadingEvents(false);
    };

    fetchUserEvents();
  }, [selectedUser]);

  const EventList = ({
    events,
    type,
  }: {
    events: Event[];
    type: "hosting" | "attending";
  }) => {
    if (isLoadingEvents) {
      return <Skeleton className="h-20" />;
    }

    if (events.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No upcoming events {type === "hosting" ? "hosted" : "attending"}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent closing the user drawer
              setSelectedEvent(event);
            }}
          >
            <span className="text-xl">{event.vibe || "🎯"}</span>
            <div className="space-y-1 flex-1">
              <p className="font-medium text-sm">{event.title}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <time>
                  {format(new Date(event.start_time), "MMM d, h:mm a")}
                </time>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
        <h1 className="text-2xl font-semibold mb-3">Stop lurking! 👀</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Sign up to see who's coming to Sri Lanka and what vibes they're
          bringing
        </p>
        <Button onClick={login} size="lg">
          Sign up
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold">Community</h1>
            <p className="text-muted-foreground">
              Meet the Jelloverse community members
            </p>
          </div>
          <div className="border-b mb-8" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="group rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{user.display_name}</h3>
                    <span className="text-xs bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-full px-2 py-0.5 font-medium">
                      {user.num_points || 0} ⭐
                    </span>
                  </div>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                  {user.vibes && user.vibes.length > 0 && (
                    <div className="flex gap-1">
                      {user.vibes.map((vibe) => (
                        <span key={vibe} className="text-lg">
                          {vibe}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* User Details Drawer */}
      <Drawer open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedUser?.display_name}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Vibes Section */}
              {selectedUser?.vibes && selectedUser.vibes.length > 0 && (
                <div className="flex gap-2">
                  {selectedUser.vibes.map((vibe) => (
                    <span key={vibe} className="text-2xl">
                      {vibe}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio Section */}
              {selectedUser?.bio && (
                <div>
                  <h3 className="text-sm font-medium mb-2">About</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedUser.bio}
                  </p>
                </div>
              )}

              {/* Hosting Section */}
              <div>
                <h3 className="text-sm font-medium mb-3">Hosting</h3>
                <EventList events={userEvents.hosting} type="hosting" />
              </div>

              {/* Attending Section */}
              <div>
                <h3 className="text-sm font-medium mb-3">Attending</h3>
                <EventList events={userEvents.attending} type="attending" />
              </div>
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      {/* Event Details Drawer */}
      <EventDetailsDrawer
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
