import { CampusUpdate } from '../../models/campus-update.model.js';
import { AppError } from '../../utils/AppError.js';
import { formatPagination, getPagination } from '../../utils/pagination.js';

export async function createCampusUpdate(req, res, next) {
  try {
    const payload = req.validated.body;

    const doc = await CampusUpdate.create({
      ...payload,
      createdBy: req.user.sub
    });

    const data = await doc.populate('createdBy', 'fullName email role');
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function listCampusUpdates(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.validated.query);
    const { type } = req.validated.query;

    const query = {};
    if (type) query.type = type;

    const [data, total] = await Promise.all([
      CampusUpdate.find(query)
        .populate('createdBy', 'fullName email role')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CampusUpdate.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, data, pagination: formatPagination({ page, limit, total }) });
  } catch (error) {
    return next(error);
  }
}

export async function updateCampusUpdate(req, res, next) {
  try {
    const doc = await CampusUpdate.findByIdAndUpdate(req.validated.params.id, req.validated.body, {
      new: true,
      runValidators: true
    }).populate('createdBy', 'fullName email role');

    if (!doc) throw new AppError('Campus update not found', 404);
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return next(error);
  }
}

export async function deleteCampusUpdate(req, res, next) {
  try {
    const doc = await CampusUpdate.findByIdAndDelete(req.validated.params.id);
    if (!doc) throw new AppError('Campus update not found', 404);
    return res.status(200).json({ success: true, message: 'Campus update deleted' });
  } catch (error) {
    return next(error);
  }
}
