import { Course } from '../../models/course.model.js';
import { Department } from '../../models/department.model.js';
import { Student } from '../../models/student.model.js';
import { Timetable } from '../../models/timetable.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/AppError.js';
import { formatPagination, getPagination } from '../../utils/pagination.js';

const dayOrder = new Map([
  ['Monday', 1],
  ['Tuesday', 2],
  ['Wednesday', 3],
  ['Thursday', 4],
  ['Friday', 5],
  ['Saturday', 6]
]);

async function ensureRefs({ department, course, faculty }) {
  const [depDoc, courseDoc, facultyDoc] = await Promise.all([
    Department.exists({ _id: department }),
    Course.exists({ _id: course }),
    User.exists({ _id: faculty, role: { $in: ['faculty', 'admin'] } })
  ]);

  if (!depDoc) throw new AppError('Department not found', 404);
  if (!courseDoc) throw new AppError('Course not found', 404);
  if (!facultyDoc) throw new AppError('Faculty user not found', 404);
}

export async function createTimetable(req, res, next) {
  try {
    const payload = req.validated.body;
    await ensureRefs(payload);
    const doc = await Timetable.create(payload);
    const data = await doc.populate([
      { path: 'department', select: 'name code' },
      { path: 'course', select: 'title code' },
      { path: 'faculty', select: 'fullName email role' }
    ]);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Timetable slot already exists for this room/time', 409));
    }

    return next(error);
  }
}

export async function listTimetable(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.validated.query);
    const { department, dayOfWeek } = req.validated.query;
    const query = {};
    if (department) query.department = department;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;

    const [data, total] = await Promise.all([
      Timetable.find(query)
        .populate('department', 'name code')
        .populate('course', 'title code')
        .populate('faculty', 'fullName email role')
        .sort({ dayOfWeek: 1, startTime: 1 })
        .skip(skip)
        .limit(limit),
      Timetable.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, data, pagination: formatPagination({ page, limit, total }) });
  } catch (error) {
    return next(error);
  }
}

export async function getTimetableById(req, res, next) {
  try {
    const doc = await Timetable.findById(req.validated.params.id)
      .populate('department', 'name code')
      .populate('course', 'title code')
      .populate('faculty', 'fullName email role');

    if (!doc) throw new AppError('Timetable record not found', 404);
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return next(error);
  }
}

export async function getMyTimetable(req, res, next) {
  try {
    const student = await Student.findOne({ user: req.user.sub })
      .populate('department', 'name code')
      .select('department semester section');

    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const records = await Timetable.find({ department: student.department._id })
      .populate('department', 'name code')
      .populate('course', 'title code semester')
      .populate('faculty', 'fullName email role')
      .sort({ dayOfWeek: 1, startTime: 1 });

    const data = records
      .filter((record) => Number(record.course?.semester ?? 0) === Number(student.semester))
      .sort((left, right) => {
        const dayDiff = (dayOrder.get(left.dayOfWeek) ?? 99) - (dayOrder.get(right.dayOfWeek) ?? 99);
        if (dayDiff !== 0) {
          return dayDiff;
        }

        return String(left.startTime).localeCompare(String(right.startTime));
      });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateTimetable(req, res, next) {
  try {
    const doc = await Timetable.findByIdAndUpdate(req.validated.params.id, req.validated.body, {
      new: true,
      runValidators: true
    })
      .populate('department', 'name code')
      .populate('course', 'title code')
      .populate('faculty', 'fullName email role');

    if (!doc) throw new AppError('Timetable record not found', 404);
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Timetable slot already exists for this room/time', 409));
    }

    return next(error);
  }
}

export async function deleteTimetable(req, res, next) {
  try {
    const doc = await Timetable.findByIdAndDelete(req.validated.params.id);
    if (!doc) throw new AppError('Timetable record not found', 404);
    return res.status(200).json({ success: true, message: 'Timetable deleted' });
  } catch (error) {
    return next(error);
  }
}
