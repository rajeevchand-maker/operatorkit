import type { PolicyTier } from "../core/types";

const POLICY_RANK: Record<PolicyTier, number> = {
  read: 1,
  operate: 2,
  admin: 3,
};

export function hasPolicyAccess(requester: PolicyTier, required: PolicyTier): boolean {
  if (!(requester in POLICY_RANK) || !(required in POLICY_RANK)) {
    return false;
  }

  return POLICY_RANK[requester] >= POLICY_RANK[required];
}

export function isPolicyTier(value: unknown): value is PolicyTier {
  return value === "read" || value === "operate" || value === "admin";
}
