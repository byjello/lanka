import { useState } from "react";
import { format } from "date-fns";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvents } from "@/hooks/useEvents";
import { CreateEventInput } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import EmojiPicker, {
  EmojiClickData,
  Theme,
  Categories,
} from "emoji-picker-react";
import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface CreateEventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom emoji list
const CUSTOM_EMOJIS = [
  { emoji: "🌴", name: "palm tree" },
  { emoji: "🧘‍♀️", name: "yoga" },
  { emoji: "🏄‍♂️", name: "surf" },
  { emoji: "🏃‍♂️", name: "run" },
  { emoji: "🎨", name: "paint" },
  { emoji: "🍛", name: "curry" },
  { emoji: "🥥", name: "coconut" },
  { emoji: "🍜", name: "noodles" },
  { emoji: "🍺", name: "beer" },
  { emoji: "🫖", name: "tea" },
  { emoji: "🎉", name: "party" },
];

export function CreateEventDrawer({ isOpen, onClose }: CreateEventDrawerProps) {
  const { createEvent } = useEvents();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [date, setDate] = useState<Date>();
  const [hour, setHour] = useState<string>("12");
  const [minute, setMinute] = useState<string>("00");
  const [period, setPeriod] = useState<string>("AM");
  const [formData, setFormData] = useState<Partial<CreateEventInput>>({
    title: "",
    description: "",
    duration: 60,
    location: "",
    is_core: false,
    vibe: "🌴",
  });
  const [selectedEmoji, setSelectedEmoji] = useState("🌴");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const isValidGoogleMapsLink = (url: string) => {
    return (
      url.startsWith("https://maps.google.com/") ||
      url.startsWith("https://www.google.com/maps/") ||
      url.startsWith("https://goo.gl/maps/") ||
      url.startsWith("https://maps.app.goo.gl/")
    );
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji);
    setIsEmojiPickerOpen(false);
    setFormData({ ...formData, vibe: emojiData.emoji });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!date) newErrors.date = "Date is required";
    if (!hour || !minute || !period) newErrors.time = "Time is required";
    if (!formData.vibe) newErrors.vibe = "Vibe is required";
    if (!formData.location?.trim()) {
      newErrors.location = "Location is required";
    } else if (!isValidGoogleMapsLink(formData.location)) {
      newErrors.location = "Please enter a valid Google Maps link";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let hours = parseInt(hour);
      if (period === "PM" && hours !== 12) hours += 12;
      else if (period === "AM" && hours === 12) hours = 0;

      const eventDate = new Date(date!);
      eventDate.setHours(hours, parseInt(minute));

      const eventData: CreateEventInput = {
        ...formData,
        start_time: eventDate.toISOString(),
        duration: formData.duration || 60,
        is_core: formData.is_core ?? false,
        title: formData.title ?? "cool event",
        vibe: selectedEmoji,
      };

      await createEvent(eventData);
      triggerConfetti();
      toast({
        title: "Success! 🎉",
        description: "Your event has been created",
        className: "bg-green-50 border-green-200",
      });
      onClose();
      // Reset form
      setDate(undefined);
      setHour("12");
      setMinute("00");
      setPeriod("AM");
      setSelectedEmoji("🌴");
      setFormData({
        title: "",
        description: "",
        duration: 60,
        location: "",
        is_core: false,
        vibe: "🌴",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        {isLoading && (
          <div className="absolute top-0 left-0 right-0">
            <div className="h-1 bg-primary animate-pulse" />
          </div>
        )}
        <DrawerHeader className="px-4 py-3">
          <DrawerTitle className="text-lg font-semibold">
            Create New Event
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 py-2 space-y-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Vibe *</Label>
              <Select
                value={selectedEmoji}
                onValueChange={(value) => {
                  setSelectedEmoji(value);
                  setFormData({ ...formData, vibe: value });
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select vibe">
                    {selectedEmoji && (
                      <span className="flex items-center">
                        <span className="text-xl">{selectedEmoji}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_EMOJIS.map((emojiData) => (
                    <SelectItem
                      key={emojiData.name}
                      value={emojiData.emoji}
                      className="text-sm"
                    >
                      <span className="flex items-center">
                        <span className="text-xl">{emojiData.emoji}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vibe && (
                <p className="text-sm text-destructive">{errors.vibe}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Event title"
                required
                className="h-9 text-sm"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Event description"
                className="min-h-[80px] text-sm resize-none"
                required
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full h-9 justify-start text-left font-normal text-sm",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Time *</Label>
                <div className="flex items-center gap-2">
                  <Select value={hour} onValueChange={setHour}>
                    <SelectTrigger className="w-[70px] h-9 text-sm">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem
                          key={i + 1}
                          value={String(i + 1).padStart(2, "0")}
                          className="text-sm"
                        >
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={minute} onValueChange={setMinute}>
                    <SelectTrigger className="w-[70px] h-9 text-sm">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {["00", "15", "30", "45"].map((m) => (
                        <SelectItem key={m} value={m} className="text-sm">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[70px] h-9 text-sm">
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM" className="text-sm">
                        AM
                      </SelectItem>
                      <SelectItem value="PM" className="text-sm">
                        PM
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.time && (
                  <p className="text-sm text-destructive">{errors.time}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Duration *
                </Label>
                <Select
                  value={String(formData.duration)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration: parseInt(value) })
                  }
                  required
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60, 90, 120].map((d) => (
                      <SelectItem key={d} value={String(d)} className="text-sm">
                        {d} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location *
                </Label>
              </div>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Google Maps location link"
                className="h-9 text-sm"
                required
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>

            <DrawerFooter className="px-4 py-3">
              <Button
                type="submit"
                className="w-full h-9 text-sm font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="w-full h-9 text-sm font-medium"
                >
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
