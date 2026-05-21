import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  employeeName: string;
  phone: string;
  project?: string;
  date: string;
  inTime?: string;
  outTime?: string;
  status: 'not-selected' | 'present' | 'half-day' | 'absent' | 'paid-leave';
  remarks: string;
  inPhoto?: string;
  outPhoto?: string;
  markedByHrId: string;
  markedByHrName: string;
  markedByHrEmail: string;
  deleted?: boolean;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    project: { type: String, trim: true },
    date: { type: String, required: true, index: true },
    inTime: { type: String },
    outTime: { type: String },
    status: { type: String, enum: ['not-selected', 'present', 'half-day', 'absent', 'paid-leave'], required: true },
    remarks: { type: String, default: '' },
    inPhoto: { type: String },
    outPhoto: { type: String },
    markedByHrId: { type: String, required: true, index: true },
    markedByHrName: { type: String, required: true },
    markedByHrEmail: { type: String, required: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
