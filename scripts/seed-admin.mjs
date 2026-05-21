import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not found'); process.exit(1); }

const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, lowercase: true, trim: true },
  passwordHash: String, role: String,
  status: { type: String, default: 'active' },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

await mongoose.connect(MONGODB_URI);

const email = 'shubhservices.hub@gmail.com';
const existing = await User.findOne({ email });
if (existing) {
  await User.findOneAndUpdate({ email }, { role: 'admin', deleted: false, passwordHash: await bcrypt.hash('123456', 10) });
  console.log('Admin user updated:', email);
} else {
  await User.create({ name: 'Shubh Services', email, passwordHash: await bcrypt.hash('123456', 10), role: 'admin' });
  console.log('Admin user created:', email);
}

await mongoose.disconnect();
