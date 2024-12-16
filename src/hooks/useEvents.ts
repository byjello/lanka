import useSWR from "swr";
import { Event } from "@/types/database";
import { usePrivy } from "@privy-io/react-auth";
import { createClient } from "@supabase/supabase-js";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }
  return response.json();
};

export function useEvents() {
  const { user, getAccessToken } = usePrivy();
  const { data, error, mutate } = useSWR<Event[]>("/api/events", fetcher);

  const createEvent = async (
    event: Omit<Event, "id" | "privy_user_id" | "created_at" | "updated_at">
  ) => {
    if (!user) throw new Error("Must be authenticated to create events");

    const token = await getAccessToken();
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create event");
    }

    mutate(); // Refresh the events list
    return response.json();
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) throw new Error("Must be authenticated");

    const token = await getAccessToken();
    const response = await fetch(`/api/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete event");
    }

    // Refresh the events list immediately after successful deletion
    await mutate();
  };

  const toggleAttendance = async (eventId: string) => {
    if (!user) throw new Error("Must be authenticated");

    const token = await getAccessToken();
    const response = await fetch(`/api/events/${eventId}/attend`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update attendance");
    }

    mutate(); // Refresh events list
  };

  const updateEvent = async (
    eventId: string,
    updates: Partial<
      Omit<Event, "id" | "privy_user_id" | "created_at" | "updated_at">
    >
  ) => {
    if (!user) throw new Error("Must be authenticated");

    const token = await getAccessToken();
    const response = await fetch(`/api/events/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update event");
    }

    // Refresh the events list
    await mutate();
    return response.json();
  };

  const isAttending = (event: Event) => {
    return user ? event.attendees?.includes(user.id) || false : false;
  };

  return {
    events: data,
    isLoading: !error && !data,
    isError: error,
    createEvent,
    deleteEvent,
    updateEvent,
    toggleAttendance,
    isAttending,
    mutate,
  };
}
