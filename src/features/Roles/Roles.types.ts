export interface RoleModuleRelation {
  id: number;
  moduleId: number;
  module: {
    id: number;
    name: string;
    description?: string | null;
    isActive: boolean;
    modulePermissions: Array<{
      id: number;
      permissionId: number;
      permission: {
        id: number;
        name: string;
        description?: string | null;
        isActive: boolean;
      };
    }>;
  };
}

export interface RoleUserRelation {
  id: number;
  user: {
    uid: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}

export interface RoleResponse {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userRoles: RoleUserRelation[];
  roleModules: RoleModuleRelation[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  moduleIds?: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  moduleIds?: number[];
}
