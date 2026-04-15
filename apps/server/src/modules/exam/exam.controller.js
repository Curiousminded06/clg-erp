import { Course } from '../../models/course.model.js';
import { Department } from '../../models/department.model.js';
import { Exam } from '../../models/exam.model.js';
import { AppError } from '../../utils/AppError.js';
import { formatPagination, getPagination } from '../../utils/pagination.js';

async function ensureRefs({ department, course }) {
  const [depDoc, courseDoc] = await Promise.all([
    Department.exists({ _id: department }),
    Course.exists({ _id: course })
  ]);

  if (!depDoc) throw new AppError('Department not found', 404);
  if (!courseDoc) throw new AppError('Course not found', 404);
}

export async function createExam(req, res, next) {
  try {
    const payload = req.validated.body;
    await ensureRefs(payload);
    const doc = await Exam.create(payload);
    const data = await doc.populate([
      { path: 'department', select: 'name code' },
      { path: 'course', select: 'title code' }
    ]);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Exam already exists for this course/type/date', 409));
    }

    return next(error);
  }
}

export async function listExams(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.validated.query);
    const { department, examType } = req.validated.query;
    const query = {};
    if (department) query.department = department;
    if (examType) query.examType = examType;

    const [data, total] = await Promise.all([
      Exam.find(query)
        .populate('department', 'name code')
        .populate('course', 'title code')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Exam.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, data, pagination: formatPagination({ page, limit, total }) });
  } catch (error) {
    return next(error);
  }
}

export async function getExamById(req, res, next) {
  try {
    const doc = await Exam.findById(req.validated.params.id)
      .populate('department', 'name code')
      .populate('course', 'title code');

    if (!doc) throw new AppError('Exam not found', 404);
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return next(error);
  }
}

export async function updateExam(req, res, next) {
  try {
    const doc = await Exam.findByIdAndUpdate(req.validated.params.id, req.validated.body, {
      new: true,
      runValidators: true
    })
      .populate('department', 'name code')
      .populate('course', 'title code');

    if (!doc) throw new AppError('Exam not found', 404);
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Exam already exists for this course/type/date', 409));
    }

    return next(error);
  }
}

export async function deleteExam(req, res, next) {
  try {
    const doc = await Exam.findByIdAndDelete(req.validated.params.id);
    if (!doc) throw new AppError('Exam not found', 404);
    return res.status(200).json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    return next(error);
  }
}
