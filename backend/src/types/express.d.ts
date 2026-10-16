
import type { IUserMethods } from "../models/user.model.js";

declare global {
  namespace Express {
    interface User extends IUserMethods {
      id: string;
    }
  }
}

export {};
