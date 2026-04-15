import { Department } from '../../models/department.model.js';
import { Student } from '../../models/student.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword } from '../auth/auth.service.js';

function toPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1
  };
}

async function ensureStudentDependencies({ user, department, email }) {
  const departmentDoc = await Department.findById(department);

  if (!departmentDoc) {
    throw new AppError('Department not found', 404);
  }

  if (user) {
    const userDoc = await User.findById(user);

    if (!userDoc) {
      throw new AppError('User not found', 404);
    }

    if (userDoc.role !== 'student') {
      throw new AppError('Selected user must have student role', 400);
    }

    return userDoc;
  }

  const existingUser = await User.findOne({ email: String(email).toLowerCase() });

  if (existingUser) {
    if (existingUser.role !== 'student') {
      throw new AppError('Email already belongs to a non-student account', 409);
    }

    return existingUser;
  }

  return null;
}

export async function createStudent(req, res, next) {
  try {
    const payload = { ...req.validated.body, enrollmentNo: req.validated.body.enrollmentNo.toUpperCase() };
    const existingUser = await ensureStudentDependencies(payload);

    let userDoc = existingUser;

    if (!userDoc) {
      const passwordHash = await hashPassword(String(payload.password));
      userDoc = await User.create({
        fullName: payload.fullName,
        email: String(payload.email).toLowerCase(),
        passwordHash,
        role: 'student'
      });
    }

    const studentPayload = {
      user: userDoc._id,
      enrollmentNo: payload.enrollmentNo,
      department: payload.department,
      semester: payload.semester,
      section: payload.section,
      dob: payload.dob,
      phone: payload.phone,
      address: payload.address,
      active: payload.active
    };

    const student = await Student.create(studentPayload);
    const result = await student.populate([
      { path: 'user', select: 'fullName email role' },
      { path: 'department', select: 'name code' }
    ]);

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Student enrollment or user mapping already exists', 409));
    }

    return next(error);
  }
}

export async function listStudents(req, res, next) {
  try {
    const { page, limit, search, department, semester, active } = req.validated.query;
    const query = {};

    if (department) {
      query.department = department;
    }

    if (semester) {
      query.semester = semester;
    }

    if (active !== undefined) {
      query.active = active;
    }

    if (search) {
      query.$or = [
        { enrollmentNo: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Student.find(query)
        .populate('user', 'fullName email role')
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data,
      pagination: toPagination(page, limit, total)
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentById(req, res, next) {
  try {
    const student = await Student.findById(req.validated.params.id)
      .populate('user', 'fullName email role')
      .populate('department', 'name code');

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    if (req.user.role === 'student' && String(student.user._id) !== req.user.sub) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }

    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    return next(error);
  }
}

export async function updateStudent(req, res, next) {
  try {
    const payload = { ...req.validated.body };

    if (payload.department) {
      const exists = await Department.exists({ _id: payload.department });
      if (!exists) {
        throw new AppError('Department not found', 404);
      }
    }

    if (payload.enrollmentNo) {
      payload.enrollmentNo = payload.enrollmentNo.toUpperCase();
    }

    const student = await Student.findByIdAndUpdate(req.validated.params.id, payload, {
      new: true,
      runValidators: true
    })
      .populate('user', 'fullName email role')
      .populate('department', 'name code');

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Enrollment number already exists', 409));
    }

    return next(error);
  }
}

export async function deleteStudent(req, res, next) {
  try {
    const student = await Student.findByIdAndDelete(req.validated.params.id);

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    return res.status(200).json({ success: true, message: 'Student deleted' });
  } catch (error) {
    return next(error);
  }
}
