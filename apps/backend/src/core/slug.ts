import { randomUUID } from "node:crypto";

export function createSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function uniqueSlug(value: string): string {
  return `${createSlug(value) || "workspace"}-${randomUUID().slice(0, 6)}`;
}
