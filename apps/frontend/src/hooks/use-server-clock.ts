import { useEffect, useMemo, useState } from "react";

export function useServerClock(serverTime?: string): string {
  const offset = useMemo(
    () => (serverTime ? new Date(serverTime).getTime() - Date.now() : 0),
    [serverTime]
  );
  const [now, setNow] = useState(() => new Date(Date.now() + offset).toISOString());

  useEffect(() => {
    setNow(new Date(Date.now() + offset).toISOString());
    const interval = window.setInterval(
      () => setNow(new Date(Date.now() + offset).toISOString()),
      30_000
    );
    return () => window.clearInterval(interval);
  }, [offset]);

  return now;
}
