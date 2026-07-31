import { Schema, model } from "mongoose";

export interface OrganisationDocument {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const organisationSchema = new Schema<OrganisationDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true }
  },
  { timestamps: true }
);

export const OrganisationModel = model<OrganisationDocument>("Organisation", organisationSchema);
