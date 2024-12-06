import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMetadata } from "@/types/database";
import { UserProfileDrawer } from "./user-profile-drawer";

interface AttendeesListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  attendees: string[]; // Array of privy_ids
}

export function AttendeesListDrawer({
  isOpen,
  onClose,
  attendees,
}: AttendeesListDrawerProps) {
  const [users, setUsers] = useState<UserMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserMetadata | null>(null);

  useEffect(() => {
    const fetchAttendees = async () => {
      if (!attendees.length) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("*")
        .in("privy_id", attendees);

      if (data) {
        setUsers(data);
      }
      setIsLoading(false);
    };

    if (isOpen) {
      fetchAttendees();
    }
  }, [attendees, isOpen]);

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>People Attending</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.privy_id}
                    className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <p className="font-medium">{user.display_name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No one is attending yet
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <UserProfileDrawer
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </>
  );
}
