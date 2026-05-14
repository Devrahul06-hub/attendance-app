import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  employeeName: string;
  date: string;
  time: string;
  status: 'present' | 'absent';
  remarks: string;
  imageUrl?: string;
  markedByHrId: string;
  markedByHrName: string;
  markedByHrEmail: string;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeName: { type: String, required: true, trim: true },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
    remarks: { type: String, default: '' },
    imageUrl: { type: String },
    markedByHrId: { type: String, required: true, index: true },
    markedByHrName: { type: String, required: true },
    markedByHrEmail: { type: String, required: true },
  },
  { timestamps: true }
);

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
