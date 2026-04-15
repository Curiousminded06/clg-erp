import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Attendance } from '../src/models/attendance.model.js';
import { Course } from '../src/models/course.model.js';
import { Department } from '../src/models/department.model.js';
import { Exam } from '../src/models/exam.model.js';
import { Invoice } from '../src/models/invoice.model.js';
import { Student } from '../src/models/student.model.js';
import { Timetable } from '../src/models/timetable.model.js';
import { User } from '../src/models/user.model.js';

const collectionsInOrder = [
  Attendance,
  Exam,
  Invoice,
  Timetable,
  Student,
  Course,
  Department,
  User
];

async function loadSeedData() {
  const raw = await fs.readFile(new URL('./dummy-data.json', import.meta.url), 'utf8');
  return JSON.parse(raw);
}

async function resetCollections() {
  for (const model of collectionsInOrder) {
    await model.deleteMany({});
  }
}

async function seedCollection(model, rows) {
  if (!rows?.length) {
    return 0;
  }

  await model.insertMany(rows, { ordered: true });
  return rows.length;
}

async function main() {
  const data = await loadSeedData();

  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to MongoDB');

  await resetCollections();

  const counts = {
    users: await seedCollection(User, data.users),
    departments: await seedCollection(Department, data.departments),
    courses: await seedCollection(Course, data.courses),
    students: await seedCollection(Student, data.students),
    timetables: await seedCollection(Timetable, data.timetables),
    exams: await seedCollection(Exam, data.exams),
    attendance: await seedCollection(Attendance, data.attendance),
    invoices: await seedCollection(Invoice, data.invoices)
  };

  console.log('Seed completed');
  console.log(JSON.stringify(counts, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Seed failed');
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }

  process.exit(1);
});