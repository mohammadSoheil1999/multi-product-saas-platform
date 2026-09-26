const queryTenant = new URLSearchParams(window.location.search).get("tenant")
  ?.trim()
  .toLowerCase();
const storedTenant = localStorage.getItem("appointment-tenant");

if (queryTenant && queryTenant !== storedTenant) {
  // A session belongs to one tenant. Never reuse it after switching businesses.
  localStorage.removeItem("token");
  localStorage.setItem("appointment-tenant", queryTenant);
}

export const tenantId = queryTenant || storedTenant || "luxorius-demo";
export const tenantHeaders = { "X-Tenant": tenantId };
