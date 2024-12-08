import { LoadScript } from "@react-google-maps/api";
import { useMemo } from "react";
import type { Libraries } from "@react-google-maps/api";

interface MapsProviderProps {
  children: React.ReactNode;
}

export function MapsProvider({ children }: MapsProviderProps) {
  const libraries: Libraries = useMemo(() => ["places"], []);

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={libraries}
    >
      {children}
    </LoadScript>
  );
}
