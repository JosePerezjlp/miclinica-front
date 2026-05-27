export interface PermissionModuleRelation {
  id: number;
  moduleId: number;
  module: {
    id: number;
    name: string;
    isActive: boolean;
  };
}

export interface PermissionResponse {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  modulePermissions?: PermissionModuleRelation[];
}

export interface ModulePermissionRelation {
  id: number;
  permissionId: number;
  permission: PermissionResponse;
}

export interface AccessModuleResponse {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roleModules: Array<{
    id: number;
    roleId: number;
    role: {
      id: number;
      name: string;
      isActive: boolean;
    };
  }>;
  modulePermissions: ModulePermissionRelation[];
}

export interface CreateModuleRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: number[];
}

export interface UpdateModuleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: number[];
}

export interface CreatePermissionRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}
