import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'employee';
  employeeId?: string;
  designation?: string;
  project?: string;
  phone?: string;
  salary?: string;
  status: 'active' | 'inactive';
  joinDate?: string;
  deleted?: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'employee'],
      default: 'employee',
    },
    employeeId: { type: String, trim: true },
    designation: { type: String, trim: true },
    project: { type: String, trim: true },
    phone: { type: String, trim: true },
    salary: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    joinDate: { type: String, trim: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
