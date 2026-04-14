export interface IUser {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  bio?: string;
  role: "user" | "admin";
  status: "ONLINE" | "OFFLINE";
  followersCount: number;
  followingCount: number;
  deactived: boolean;
  createdAt: string;
  updatedAt: string;
}
