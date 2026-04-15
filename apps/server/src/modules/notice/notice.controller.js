import { Department } from '../../models/department.model.js';
import { Notice } from '../../models/notice.model.js';
import { AppError } from '../../utils/AppError.js';
import { formatPagination, getPagination } from '../../utils/pagination.js';

async function ensureDepartment(departmentId) {
  if (!departmentId) {
    return;
  }

  const exists = await Department.exists({ _id: departmentId });
  if (!exists) throw new AppError('Department not found', 404);
}

export async function createNotice(req, res, next) {
  try {
    const payload = req.validated.body;
    await ensureDepartment(payload.department);

    const doc = await Notice.create({
      title: payload.title,
      message: payload.message,
      audience: payload.audience,
      department: payload.department ?? null,
      expiresAt: payload.expiresAt ?? null,
      createdBy: req.user.sub
    });

    const data = await doc.populate([
      { path: 'department', select: 'name code' },
      { path: 'createdBy', select: 'fullName email role' }
    ]);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function listNotices(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.validated.query);
    const { audience, department } = req.validated.query;
    const query = {};

    if (audience) query.audience = audience;
    if (department) query.department = department;

    if (req.user.role === 'student') {
      query.audience = { $in: ['all', 'students'] };
    }

    if (req.user.role === 'faculty') {
      query.audience = { $in: ['all', 'faculty'] };
    }

    query.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];

    const [data, total] = await Promise.all([
      Notice.find(query)
        .populate('department', 'name code')
        .populate('createdBy', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notice.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, data, pagination: formatPagination({ page, limit, total }) });
  } catch (error) {
    return next(error);
  }
}

export async function updateNotice(req, res, next) {
  try {
    const notice = await Notice.findById(req.validated.params.id);
    if (!notice) throw new AppError('Notice not found', 404);

    if (String(notice.createdBy) !== String(req.user.sub)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }

    await ensureDepartment(req.validated.body.department);

    const data = await Notice.findByIdAndUpdate(
      req.validated.params.id,
      {
        ...req.validated.body,
        department: req.validated.body.department ?? notice.department,
        expiresAt:
          Object.prototype.hasOwnProperty.call(req.validated.body, 'expiresAt')
            ? req.validated.body.expiresAt
            : notice.expiresAt
      },
      { new: true, runValidators: true }
    )
      .populate('department', 'name code')
      .populate('createdBy', 'fullName email role');

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function deleteNotice(req, res, next) {
  try {
    const notice = await Notice.findById(req.validated.params.id);
    if (!notice) throw new AppError('Notice not found', 404);

    if (String(notice.createdBy) !== String(req.user.sub)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }

    await Notice.findByIdAndDelete(req.validated.params.id);
    return res.status(200).json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    return next(error);
  }
}
