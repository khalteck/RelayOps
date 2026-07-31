import { useEffect, useState } from "react";
import type { ColorMode } from "@relayops/ui";
import { useUiStore } from "../stores/ui.store";

export function useColorMode(): ColorMode {
  const preference = useUiStore((state) => state.theme);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}
