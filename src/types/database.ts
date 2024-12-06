export interface UserMetadata {
  id: string;
  privy_id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  vibes?: string[];
  avatar_url?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  duration: number;
  location?: string;
  location_name?: string;
  is_core: boolean;
  privy_user_id: string;
  vibe?: string;
  attendees?: string[];
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

// Additional types for API requests
export type CreateEventInput = Omit<
  Event,
  "id" | "privy_user_id" | "created_at" | "updated_at"
>;
export type UpdateEventInput = Partial<CreateEventInput>;

export interface UserOnboarding {
  display_name: string;
  bio: string;
}
