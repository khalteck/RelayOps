import type { AccountPreferences } from "@relayops/types";
import { Schema, model } from "mongoose";

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date;
  preferences: AccountPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerifiedAt: { type: Date, required: true, default: Date.now },
    preferences: {
      theme: { type: String, enum: ["system", "light", "dark"], default: "system" },
      inApp: {
        incidentAssigned: { type: Boolean, default: true },
        incidentUpdated: { type: Boolean, default: true },
        incidentCommented: { type: Boolean, default: true }
      }
    }
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", userSchema);
