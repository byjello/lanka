import { useState, useMemo, useRef, useEffect } from "react";
import { format, addDays } from "date-fns";
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
import { Autocomplete } from "@react-google-maps/api";
import { Search } from "lucide-react";

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
  const [endHour, setEndHour] = useState<string>("12");
  const [endMinute, setEndMinute] = useState<string>("00");
  const [endPeriod, setEndPeriod] = useState<string>("AM");
  const [formData, setFormData] = useState<Partial<CreateEventInput>>({
    title: "",
    description: "",
    location: "",
    location_name: "",
    is_core: false,
    vibe: "🌴",
  });
  const [selectedEmoji, setSelectedEmoji] = useState("🌴");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
    try {
      if (!formData.title?.trim()) {
        throw new Error("Title is required");
      }
      if (!date) {
        throw new Error("Date is required");
      }
      if (!hour || !minute || !period) {
        throw new Error("Time is required");
      }
      if (!formData.location_name?.trim()) {
        throw new Error("Location name is required");
      }
      if (!formData.location?.trim()) {
        throw new Error("Location link is required");
      }
      if (!isValidGoogleMapsLink(formData.location)) {
        throw new Error("Please enter a valid Google Maps link");
      }
      return true;
    } catch (error) {
      toast({
        title: "Validation Error",
        description:
          error instanceof Error
            ? error.message
            : "Please check all required fields",
        variant: "destructive",
      });
      return false;
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const initialFormState = {
    title: "",
    description: "",
    location: "",
    location_name: "",
    is_core: false,
    vibe: "🌴",
  };

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData(initialFormState);
    setDate(undefined);
    setHour("12");
    setMinute("00");
    setPeriod("AM");
    setEndHour("12");
    setEndMinute("00");
    setEndPeriod("AM");
    setLocationInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!date) throw new Error("Date is required");
      if (!hour || !minute || !period)
        throw new Error("Start time is required");
      if (!endHour || !endMinute || !endPeriod)
        throw new Error("End time is required");

      // Check formData directly for location fields
      if (!formData.location_name?.trim())
        throw new Error("Location name is required");
      if (!formData.location?.trim()) throw new Error("Location is required");

      let hours = parseInt(hour);
      if (period === "PM" && hours !== 12) hours += 12;
      else if (period === "AM" && hours === 12) hours = 0;

      let endHours = parseInt(endHour);
      if (endPeriod === "PM" && endHours !== 12) endHours += 12;
      else if (endPeriod === "AM" && endHours === 12) endHours = 0;

      const eventDate = new Date(date);
      eventDate.setHours(hours, parseInt(minute));

      let endDate = new Date(date);
      endDate.setHours(endHours, parseInt(endMinute));

      // If end time is before start time, assume it's the next day
      if (endDate <= eventDate) {
        endDate = addDays(endDate, 1);
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        location_name: formData.location_name,
        is_core: formData.is_core,
        vibe: formData.vibe,
        start_time: eventDate.toISOString(),
        end_time: endDate.toISOString(),
      };

      await createEvent(eventData);

      // Trigger confetti on success
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast({
        title: "Success! 🎉",
        description: "Event created successfully",
      });

      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceSelected = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.place_id) {
        const fullName = place.name || place.formatted_address || "";
        const mapsUrl = place.url;

        // Update both form data and location input synchronously
        setLocationInput(fullName);
        setFormData((prev) => ({
          ...prev,
          location_name: fullName,
          location: mapsUrl,
        }));
      }
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
                <Label className="text-sm font-medium">End Time *</Label>
                <div className="flex items-center gap-2">
                  <Select value={endHour} onValueChange={setEndHour}>
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

                  <Select value={endMinute} onValueChange={setEndMinute}>
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

                  <Select value={endPeriod} onValueChange={setEndPeriod}>
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
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Location *</Label>
                <div className="relative">
                  <Autocomplete
                    onLoad={onLoad}
                    onPlaceChanged={onPlaceSelected}
                    restrictions={{ country: "lk" }}
                  >
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        type="text"
                        className="pl-8 h-9 text-sm"
                        placeholder="Search for a location..."
                        required
                      />
                    </div>
                  </Autocomplete>
                </div>
              </div>
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
