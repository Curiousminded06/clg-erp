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

export async function createDepartment(req, res, next) {
  try {
    const payload = req.validated.body;
    const department = await Department.create({
      ...payload,
      code: payload.code.toUpperCase()
    });

    return res.status(201).json({ success: true, data: department });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Department name or code already exists', 409));
    }

    return next(error);
  }
}

export async function listDepartments(req, res, next) {
  try {
    const { page, limit, search } = req.validated.query;
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Department.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Department.countDocuments(query)
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

export async function getDepartmentById(req, res, next) {
  try {
    const department = await Department.findById(req.validated.params.id);

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    return res.status(200).json({ success: true, data: department });
  } catch (error) {
    return next(error);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const payload = { ...req.validated.body };

    if (payload.code) {
      payload.code = payload.code.toUpperCase();
    }

    const department = await Department.findByIdAndUpdate(req.validated.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    return res.status(200).json({ success: true, data: department });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new AppError('Department name or code already exists', 409));
    }

    return next(error);
  }
}

export async function deleteDepartment(req, res, next) {
  try {
    const department = await Department.findByIdAndDelete(req.validated.params.id);

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    return res.status(200).json({ success: true, message: 'Department deleted' });
  } catch (error) {
    return next(error);
  }
}
