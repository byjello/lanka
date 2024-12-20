import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { verifyPrivyToken } from "@/lib/auth";
import { CreateEventInput } from "@/types/database";
import { awardPoints } from "@/lib/points";

const START_DATE = "2024-12-29";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // No auth required for reading events
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("start_time", START_DATE)
      .order("start_time", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // For POST requests, we still need auth
  const privyId = await verifyPrivyToken(req);
  if (!privyId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    const eventData: CreateEventInput = req.body;

    if (!eventData.title || !eventData.start_time || !eventData.end_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Create the event
      const { data: event, error } = await supabase
        .from("events")
        .insert([
          {
            ...eventData,
            privy_user_id: privyId,
            attendees: [privyId], // Creator automatically attends
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Award points for creating an event (every time)
      await awardPoints(privyId, "CREATE_JAM");

      return res.status(200).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      return res.status(500).json({ error: "Failed to create event" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
