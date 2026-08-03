export async function loadAppShell() {
  const { AppShell } = await import("@/components/app-shell");
  return { Component: AppShell };
}
