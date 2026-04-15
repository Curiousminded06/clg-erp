import { Attendance } from '../../models/attendance.model.js';
import { Course } from '../../models/course.model.js';
import { Student } from '../../models/student.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/AppError.js';
import { formatPagination, getPagination } from '../../utils/pagination.js';

async function ensureRefs({ student, course, faculty }) {
  const [studentDoc, courseDoc, facultyDoc] = await Promise.all([
    Student.exists({ _id: student }),
    Course.exists({ _id: course }),
    User.exists({ _id: faculty, role: { $in: ['faculty', 'admin'] } })
  ]);

  if (!studentDoc) throw new AppError('Student not found', 404);
  if (!courseDoc) throw new AppError('Course not found', 404);
  if (!facultyDoc) throw new AppError('Faculty user not found', 404);
}

export async function createAttendance(req, res, next) {
  try {
    const payload = req.validated.body;
    await ensureRefs(payload);
    const doc = await Attendance.create(payload);
    const data = await doc.populate([
      { path: 'student', select: 'enrollmentNo semester section' },
      { path: 'course', select: 'title code' },
      { path: 'faculty', select: 'fullName email role' }
    ]);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Attendance already marked for this date/course/student', 409));
    }

    return next(error);
  }
}

export async function listAttendance(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.validated.query);
    const { student, course, status } = req.validated.query;
    const query = {};
    if (student) query.student = student;
    if (course) query.course = course;
    if (status) query.status = status;

    const [data, total] = await Promise.all([
      Attendance.find(query)
        .populate('student', 'enrollmentNo semester section')
        .populate('course', 'title code')
        .populate('faculty', 'fullName email role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, data, pagination: formatPagination({ page, limit, total }) });
  } catch (error) {
    return next(error);
  }
}

export async function getAttendanceById(req, res, next) {
  try {
    const doc = await Attendance.findById(req.validated.params.id)
      .populate('student', 'enrollmentNo semester section')
      .populate('course', 'title code')
      .populate('faculty', 'fullName email role');

    if (!doc) throw new AppError('Attendance record not found', 404);

    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return next(error);
  }
}

export async function updateAttendance(req, res, next) {
  try {
    const doc = await Attendance.findByIdAndUpdate(req.validated.params.id, req.validated.body, {
      new: true,
      runValidators: true
    })
      .populate('student', 'enrollmentNo semester section')
      .populate('course', 'title code')
      .populate('faculty', 'fullName email role');

    if (!doc) throw new AppError('Attendance record not found', 404);

    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAttendance(req, res, next) {
  try {
    const doc = await Attendance.findByIdAndDelete(req.validated.params.id);
    if (!doc) throw new AppError('Attendance record not found', 404);
    return res.status(200).json({ success: true, message: 'Attendance deleted' });
  } catch (error) {
    return next(error);
  }
}
