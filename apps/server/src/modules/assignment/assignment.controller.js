import { Assignment, AssignmentSubmission } from '../../models/assignment.model.js';
import { Course } from '../../models/course.model.js';
import { Department } from '../../models/department.model.js';
import { Student } from '../../models/student.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/AppError.js';
import { formatPagination, getPagination } from '../../utils/pagination.js';

async function ensureAssignmentRefs({ department, course }) {
  const [depDoc, courseDoc] = await Promise.all([
    Department.exists({ _id: department }),
    Course.findById(course).select('department semester')
  ]);

  if (!depDoc) throw new AppError('Department not found', 404);
  if (!courseDoc) throw new AppError('Course not found', 404);
  if (String(courseDoc.department) !== String(department)) {
    throw new AppError('Course does not belong to the selected department', 400);
  }

  return courseDoc;
}

async function getStudentProfile(userId) {
  const student = await Student.findOne({ user: userId }).select('_id department semester');
  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  return student;
}

export async function createAssignment(req, res, next) {
  try {
    const payload = req.validated.body;
    await ensureAssignmentRefs(payload);

    const doc = await Assignment.create({
      ...payload,
      faculty: req.user.sub
    });

    const data = await doc.populate([
      { path: 'department', select: 'name code' },
      { path: 'course', select: 'title code semester' },
      { path: 'faculty', select: 'fullName email role' }
    ]);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function listAssignments(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.validated.query);
    const { department, course } = req.validated.query;
    const query = {};

    if (department) query.department = department;
    if (course) query.course = course;

    if (req.user.role === 'faculty') {
      query.faculty = req.user.sub;
    }

    if (req.user.role === 'student') {
      const student = await getStudentProfile(req.user.sub);
      const courses = await Course.find({ department: student.department, semester: student.semester }).select('_id');
      query.department = student.department;
      query.course = { $in: courses.map((item) => item._id) };
    }

    const [data, total] = await Promise.all([
      Assignment.find(query)
        .populate('department', 'name code')
        .populate('course', 'title code semester')
        .populate('faculty', 'fullName email role')
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Assignment.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, data, pagination: formatPagination({ page, limit, total }) });
  } catch (error) {
    return next(error);
  }
}

export async function updateAssignment(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.validated.params.id);
    if (!assignment) throw new AppError('Assignment not found', 404);

    if (String(assignment.faculty) !== String(req.user.sub)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }

    const updated = await Assignment.findByIdAndUpdate(req.validated.params.id, req.validated.body, {
      new: true,
      runValidators: true
    })
      .populate('department', 'name code')
      .populate('course', 'title code semester')
      .populate('faculty', 'fullName email role');

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAssignment(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.validated.params.id);
    if (!assignment) throw new AppError('Assignment not found', 404);

    if (String(assignment.faculty) !== String(req.user.sub)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }

    await Promise.all([
      Assignment.findByIdAndDelete(req.validated.params.id),
      AssignmentSubmission.deleteMany({ assignment: req.validated.params.id })
    ]);

    return res.status(200).json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    return next(error);
  }
}

export async function submitAssignment(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.validated.params.id).select('_id dueDate maxPoints');
    if (!assignment) throw new AppError('Assignment not found', 404);

    const student = await getStudentProfile(req.user.sub);

    const payload = {
      assignment: assignment._id,
      student: student._id,
      content: req.validated.body.content,
      attachmentUrl: req.validated.body.attachmentUrl ?? '',
      submittedAt: new Date(),
      status: 'submitted',
      grade: null,
      feedback: '',
      gradedBy: null,
      gradedAt: null
    };

    const doc = await AssignmentSubmission.findOneAndUpdate(
      { assignment: assignment._id, student: student._id },
      payload,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    )
      .populate({
        path: 'assignment',
        select: 'title dueDate maxPoints course department',
        populate: [
          { path: 'course', select: 'title code semester' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate({ path: 'student', select: 'enrollmentNo semester section', populate: { path: 'user', select: 'fullName email' } })
      .populate('gradedBy', 'fullName email role');

    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return next(error);
  }
}

export async function listAssignmentSubmissions(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.validated.params.id).select('faculty');
    if (!assignment) throw new AppError('Assignment not found', 404);

    if (String(assignment.faculty) !== String(req.user.sub)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }

    const data = await AssignmentSubmission.find({ assignment: assignment._id })
      .populate({ path: 'student', select: 'enrollmentNo semester section', populate: { path: 'user', select: 'fullName email' } })
      .populate('gradedBy', 'fullName email role')
      .sort({ submittedAt: -1 });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function listMySubmissions(req, res, next) {
  try {
    const student = await getStudentProfile(req.user.sub);
    const { page, limit, skip } = getPagination(req.validated.query);

    const [data, total] = await Promise.all([
      AssignmentSubmission.find({ student: student._id })
        .populate({
          path: 'assignment',
          select: 'title dueDate maxPoints course department faculty',
          populate: [
            { path: 'course', select: 'title code semester' },
            { path: 'department', select: 'name code' },
            { path: 'faculty', select: 'fullName email role' }
          ]
        })
        .populate('gradedBy', 'fullName email role')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      AssignmentSubmission.countDocuments({ student: student._id })
    ]);

    return res.status(200).json({ success: true, data, pagination: formatPagination({ page, limit, total }) });
  } catch (error) {
    return next(error);
  }
}

export async function gradeAssignmentSubmission(req, res, next) {
  try {
    const submission = await AssignmentSubmission.findById(req.validated.params.submissionId).populate('assignment', 'faculty');
    if (!submission) throw new AppError('Submission not found', 404);

    if (String(submission.assignment.faculty) !== String(req.user.sub)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }

    const grader = await User.findById(req.user.sub).select('_id');
    if (!grader) throw new AppError('Grader user not found', 404);

    submission.grade = req.validated.body.grade;
    submission.feedback = req.validated.body.feedback ?? '';
    submission.status = 'graded';
    submission.gradedBy = grader._id;
    submission.gradedAt = new Date();

    await submission.save();

    const data = await AssignmentSubmission.findById(submission._id)
      .populate({ path: 'student', select: 'enrollmentNo semester section', populate: { path: 'user', select: 'fullName email' } })
      .populate({
        path: 'assignment',
        select: 'title dueDate maxPoints course department faculty',
        populate: [
          { path: 'course', select: 'title code semester' },
          { path: 'department', select: 'name code' },
          { path: 'faculty', select: 'fullName email role' }
        ]
      })
      .populate('gradedBy', 'fullName email role');

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}
