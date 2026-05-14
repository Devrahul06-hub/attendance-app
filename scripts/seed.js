/**
 * Seed script — populates sample users + attendance records for demos.
 *
 * Run with:
 *   node scripts/seed.js
 *
 * Requires MONGODB_URI in .env.local
 */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: String, email: { type: String, unique: true }, passwordHash: String,
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  },
  { timestamps: true }
);
const AttendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String, email: String,
    date: String, time: String,
    status: { type: String, enum: ['present', 'absent'] },
    remarks: String, imageUrl: String, imageFileId: String,
  },
  { timestamps: true }
);
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

const sampleUsers = [
  { name: 'Aanya Sharma',  email: 'aanya@punchpilot.dev',  role: 'admin' },
  { name: 'Rohit Mehra',   email: 'rohit@punchpilot.dev',  role: 'employee' },
  { name: 'Priya Iyer',    email: 'priya@punchpilot.dev',  role: 'employee' },
  { name: 'Vikram Singh',  email: 'vikram@punchpilot.dev', role: 'employee' },
  { name: 'Neha Kapoor',   email: 'neha@punchpilot.dev',   role: 'employee' },
];

function daysAgoDateString(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function randomTime() {
  const h = 8 + Math.floor(Math.random() * 3);
  const m = Math.floor(Math.random() * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Seeding…');

  await User.deleteMany({});
  await Attendance.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);
  const created = await User.insertMany(
    sampleUsers.map((u) => ({ ...u, passwordHash }))
  );

  const records = [];
  for (const user of created) {
    for (let d = 0; d < 14; d++) {
      // Skip some days randomly to simulate real life
      if (Math.random() < 0.15) continue;
      const isAbsent = Math.random() < 0.18;
      records.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        date: daysAgoDateString(d),
        time: randomTime(),
        status: isAbsent ? 'absent' : 'present',
        remarks: isAbsent
          ? ['Sick leave', 'Personal day', 'Family event'][Math.floor(Math.random() * 3)]
          : Math.random() < 0.3 ? 'Working from home' : '',
      });
    }
  }
  await Attendance.insertMany(records);

  console.log(`✓ Seeded ${created.length} users and ${records.length} attendance records.`);
  console.log('\nLogin with any of:');
  sampleUsers.forEach((u) => console.log(`  ${u.email}  /  password123  (${u.role})`));

  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
