export interface UserRoleRelation {
  id: number;
  roleId: number;
  role: {
    id: number;
    name: string;
    description?: string | null;
    isActive: boolean;
  };
}

export interface UserResponse {
  uid: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  userRoles: UserRoleRelation[];
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  roleIds?: number[];
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roleIds?: number[];
}
