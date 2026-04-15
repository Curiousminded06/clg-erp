import { Course } from '../../models/course.model.js';
import { Department } from '../../models/department.model.js';
import { AppError } from '../../utils/AppError.js';

function toPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1
  };
}

async function ensureDepartmentExists(departmentId) {
  const exists = await Department.exists({ _id: departmentId });

  if (!exists) {
    throw new AppError('Department not found', 404);
  }
}

export async function createCourse(req, res, next) {
  try {
    const payload = req.validated.body;
    await ensureDepartmentExists(payload.department);

    const course = await Course.create({
      ...payload,
      code: payload.code.toUpperCase()
    });

    const result = await course.populate('department', 'name code');
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Course code already exists', 409));
    }

    return next(error);
  }
}

export async function listCourses(req, res, next) {
  try {
    const { page, limit, search, department, semester } = req.validated.query;
    const query = {};

    if (department) {
      query.department = department;
    }

    if (semester) {
      query.semester = semester;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Course.find(query)
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(query)
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

export async function getCourseById(req, res, next) {
  try {
    const course = await Course.findById(req.validated.params.id).populate('department', 'name code');

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    return res.status(200).json({ success: true, data: course });
  } catch (error) {
    return next(error);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const payload = { ...req.validated.body };

    if (payload.department) {
      await ensureDepartmentExists(payload.department);
    }

    if (payload.code) {
      payload.code = payload.code.toUpperCase();
    }

    const course = await Course.findByIdAndUpdate(req.validated.params.id, payload, {
      new: true,
      runValidators: true
    }).populate('department', 'name code');

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    return res.status(200).json({ success: true, data: course });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Course code already exists', 409));
    }

    return next(error);
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndDelete(req.validated.params.id);

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    return res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (error) {
    return next(error);
  }
}
