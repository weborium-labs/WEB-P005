
import { model, Schema, type Model } from "mongoose";
import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../config/config.js";

interface IUser {
  display_name: string;
  email: string;
  googleId?: string;
  avatar_url?: string;
}

export interface IUserMethods {
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    display_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
    },
    avatar_url: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      userId: this._id.toString(),
      display_name: this.display_name,
      email: this.email,
    },
    config.jwtSecret,
    {
      expiresIn: config.accessTokenExpiryTime as SignOptions["expiresIn"],
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      userId: this._id.toString(),
    },
    config.jwtRefreshSecret,
    {
      expiresIn: config.refreshTokenExpiryTime as SignOptions["expiresIn"],
    }
  );
};

const User = model<IUser, UserModel>("User", userSchema);

export default User;
