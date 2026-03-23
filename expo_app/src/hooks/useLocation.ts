import { useState, useEffect } from "react";
import { getCurrentLocation, type Coordinates } from "../services/location";

export function useLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const coords = await getCurrentLocation();
        if (coords) {
          setLocation(coords);
        } else {
          setError("Location permission denied");
        }
      } catch {
        setError("Failed to get location");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getCurrentLocation();
      if (coords) {
        setLocation(coords);
      } else {
        setError("Location permission denied");
      }
    } catch {
      setError("Failed to get location");
    } finally {
      setLoading(false);
    }
  };

  return { location, loading, error, refresh };
}
