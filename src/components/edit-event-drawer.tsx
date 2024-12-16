import { CreateEventDrawer } from "./create-event-drawer";
import { Event } from "@/types/database";
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";

interface EditEventDrawerProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export function EditEventDrawer({
  event,
  isOpen,
  onClose,
}: EditEventDrawerProps) {
  const startTime = parseISO(event.start_time);
  const endTime = parseISO(event.end_time);

  // Convert event data to form initial values
  const initialValues = {
    title: event.title,
    description: event.description || "",
    location: event.location || "",
    location_name: event.location_name || "",
    vibe: event.vibe || "🌴",
    date: startTime,
    hour: format(startTime, "hh"),
    minute: format(startTime, "mm"),
    period: format(startTime, "a").toUpperCase(),
    endHour: format(endTime, "hh"),
    endMinute: format(endTime, "mm"),
    endPeriod: format(endTime, "a").toUpperCase(),
  };

  return (
    <CreateEventDrawer
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      eventId={event.id}
      initialValues={initialValues}
    />
  );
}
