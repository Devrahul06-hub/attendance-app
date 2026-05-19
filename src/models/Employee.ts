import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  employeeId?: string;
  designation?: string;
  district?: string;
  assembly?: string;
  phone?: string;
  email?: string;
  vendorName: string;
  salary?: string;
  status: 'active' | 'inactive';
  joinDate?: string;
  addedByHrId: string;
  addedByHrName: string;
  createdAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    employeeId: { type: String, trim: true, unique: true, sparse: true },
    designation: { type: String, trim: true },
    district: { type: String, trim: true },
    assembly: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    vendorName: { type: String, required: true, trim: true },
    salary: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    joinDate: { type: String, trim: true },
    addedByHrId: { type: String, required: true },
    addedByHrName: { type: String, required: true },
  },
  { timestamps: true }
);

const Employee: Model<IEmployee> =
  mongoose.models.Employee ||
  mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
