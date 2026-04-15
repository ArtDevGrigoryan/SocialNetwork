import type { IUser } from "./user.types";

export interface IResponse<T> {
  status: number;
  success: boolean;
  payload: T;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}


