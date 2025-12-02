import { IAuthCredentials, IAuthTokens } from "./auth.interface";

// Placeholder implementation – real logic will be added in Module 2
export const AuthService = {
  async login(_payload: IAuthCredentials): Promise<IAuthTokens> {
    // TODO: implement using Prisma user model, password hashing, JWT
    return {
      accessToken: "TODO_ACCESS_TOKEN",
      refreshToken: "TODO_REFRESH_TOKEN",
    };
  },
};


