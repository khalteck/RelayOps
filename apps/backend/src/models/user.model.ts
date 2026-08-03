import { Schema, model } from "mongoose";

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true, select: false }
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", userSchema);
