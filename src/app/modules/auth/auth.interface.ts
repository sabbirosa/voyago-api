export type UserRole = "TOURIST" | "GUIDE" | "ADMIN";

export interface IAuthCredentials {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}
