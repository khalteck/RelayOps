import { readFile } from "node:fs/promises";
import { parse } from "yaml";

interface RenderService {
  name?: string;
  runtime?: string;
  autoDeployTrigger?: string;
  buildCommand?: string;
  routes?: Array<{ source?: string; destination?: string }>;
}

async function validateBlueprint(): Promise<void> {
  const blueprint = parse(await readFile("render.yaml", "utf8")) as {
    services?: RenderService[];
  };
  const services = blueprint.services ?? [];
  const backend = services.find((service) => service.name === "relayops-backend");
  const frontend = services.find((service) => service.name === "relayops-frontend");

  if (!backend || !frontend)
    throw new Error("Render Blueprint must declare both RelayOps services");
  if (backend.runtime !== "node") throw new Error("Backend must use the Node runtime");
  if (frontend.runtime !== "static") throw new Error("Frontend must use the static runtime");
  if (services.some((service) => service.autoDeployTrigger !== "checksPass")) {
    throw new Error("Every Render service must wait for passing CI checks");
  }
  if (!backend.buildCommand?.includes("@relayops/backend")) {
    throw new Error("Backend build must target its workspace package");
  }
  if (!frontend.buildCommand?.includes("@relayops/frontend")) {
    throw new Error("Frontend build must target its workspace package");
  }
  if (frontend.routes?.[0]?.source !== "/api/*") {
    throw new Error("The API rewrite must precede the SPA fallback");
  }

  console.log(
    "Render Blueprint structure is valid; run `render blueprints validate render.yaml` before deployment."
  );
}

void validateBlueprint();
