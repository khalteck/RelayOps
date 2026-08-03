import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./fixtures/auth";

async function createIncident(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const organisations = await fetch("/api/v1/organisations", { credentials: "include" }).then(
      (response) => response.json()
    );
    const workspaceId = organisations.data[0].workspaces[0].id as string;
    const csrf = document.cookie
      .split("; ")
      .find((item) => item.startsWith("relayops_csrf="))
      ?.split("=")[1];
    const response = await fetch(`/api/v1/workspaces/${workspaceId}/incidents`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": decodeURIComponent(csrf ?? "")
      },
      body: JSON.stringify({
        title: `E2E collaboration ${Date.now()}`,
        description: "A deterministic browser workflow incident for realtime reconciliation.",
        affectedService: "E2E Gateway",
        priority: "P2",
        severity: "SEV2"
      })
    });
    if (!response.ok) throw new Error("Could not create the E2E incident");
    return (await response.json()).data.id as string;
  });
}

test("every seeded role restores an authorized dashboard", async ({ browser }) => {
  for (const role of ["owner", "administrator", "responder", "viewer"] as const) {
    const page = await browser.newPage();
    await signIn(page, role);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("banner").getByText(role, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await page.close();
  }
});

test("completes, reopens, and reconciles an incident across two accounts", async ({ browser }) => {
  const owner = await browser.newPage();
  await signIn(owner);
  const incidentId = await createIncident(owner);
  const incidentUrl = owner
    .url()
    .replace(/\/dashboard(?:\?.*)?$/, `/incidents?incident=${incidentId}`);
  await owner.goto(incidentUrl);
  await expect(owner.getByRole("dialog")).toBeVisible();

  const administrator = await browser.newPage();
  await signIn(administrator, "administrator");
  await administrator.goto(incidentUrl);
  await expect(administrator.getByRole("dialog")).toBeVisible();
  await expect(owner.getByText("Live updates connected")).toBeVisible();
  await expect(administrator.getByText("Live updates connected")).toBeVisible();
  const administratorDrawer = administrator.getByRole("dialog");

  for (const status of ["acknowledged", "investigating", "monitoring", "resolved"] as const) {
    await owner.getByRole("button", { name: `Move to ${status}` }).click();
    const label = status[0].toUpperCase() + status.slice(1);
    await expect(administratorDrawer.getByText(label, { exact: true })).toBeVisible();
  }
  await owner.getByRole("button", { name: "Reopen incident" }).click();
  await expect(administratorDrawer.getByText("Investigating", { exact: true })).toBeVisible();

  await administrator.reload();
  await expect(administrator).toHaveURL(new RegExp(`incident=${incidentId}`));
  await expect(
    administrator.getByRole("dialog").getByText("Investigating", { exact: true })
  ).toBeVisible();
});
