import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  employeeId: string;
  project?: string;
  phone?: string;
  addedByHrId: string;
  addedByHrName: string;
  createdAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, trim: true, unique: true },
    project: { type: String, trim: true },
    phone: { type: String, trim: true },
    addedByHrId: { type: String, required: true },
    addedByHrName: { type: String, required: true },
  },
  { timestamps: true }
);

const Employee: Model<IEmployee> =
  mongoose.models.Employee ||
  mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
