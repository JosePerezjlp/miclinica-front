import { useMemo } from "react";
import { getUserRoles } from "../api/tokenStorage";

const AFFILIATES_MODULE = "affiliates";
const REQUIRED_PERMS = ["read", "create", "update", "delete"];

export function useAffiliatesPermissions() {
  return useMemo(() => {
    const roles = getUserRoles();
    for (const role of roles) {
      for (const mod of role.modules) {
        if (mod.name.toLowerCase() === AFFILIATES_MODULE) {
          const names = mod.permissions.map((p) => p.name.toLowerCase());
          if (REQUIRED_PERMS.every((p) => names.includes(p))) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);
}
