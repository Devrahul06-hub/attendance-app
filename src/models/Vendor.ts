import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  createdAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  { name: { type: String, required: true, trim: true, unique: true } },
  { timestamps: true }
);

const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor;
