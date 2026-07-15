// Dev-only stand-in for the workerd `cloudflare:workers` built-in. Local dev
// has no bindings, so `env` is empty and the server functions take their
// graceful "database unavailable" paths. Never used in deployed builds.
export const env = {};
