import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { UserMetadata } from "@/types/database";

interface UserProfileDrawerProps {
  user: UserMetadata | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDrawer({
  user,
  isOpen,
  onClose,
}: UserProfileDrawerProps) {
  if (!user) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{user.display_name}</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-6">
          {/* Vibes */}
          {user.vibes && user.vibes.length > 0 && (
            <div className="flex gap-2">
              {user.vibes.map((vibe) => (
                <span key={vibe} className="text-2xl">
                  {vibe}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div>
              <h3 className="text-sm font-medium mb-2">About</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {user.bio}
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
