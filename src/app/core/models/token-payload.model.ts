import { RoleType } from '../enums/role-type.enum';

export interface TokenPayload {
  sub: string; // username/email
  role: RoleType;
  exp: number;
  iat: number;
}
