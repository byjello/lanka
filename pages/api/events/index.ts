import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { verifyPrivyToken } from "@/lib/auth";
import { CreateEventInput } from "@/types/database";

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
    // First verify the user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("privy_id", privyId)
      .single();

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const eventData: CreateEventInput = req.body;

    if (!eventData.title || !eventData.start_time || !eventData.duration) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        ...eventData,
        privy_user_id: privyId,
        is_core: eventData.is_core || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Event creation error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
