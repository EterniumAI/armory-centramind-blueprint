// Blueprint deployments are single-tenant per workspace. The all-zeros
// sentinel satisfies components ported from the multi-tenant Command Center.
export const useTenantId = () => '00000000-0000-0000-0000-000000000000';
