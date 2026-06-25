import type { Request } from "express";

export type JwtUser = {
  sub: string;
  walletAddress?: string;
  email?: string;
};

export type AuthedRequest = Request & {
  user?: JwtUser;
};
