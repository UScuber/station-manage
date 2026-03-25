import { buildApp } from "../app";

export function createTestApp() {
  return buildApp({ logger: false });
}
