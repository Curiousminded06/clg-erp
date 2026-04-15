import { Invoice } from '../../models/invoice.model.js';
import { Student } from '../../models/student.model.js';
import { AppError } from '../../utils/AppError.js';
import { formatPagination, getPagination } from '../../utils/pagination.js';

async function ensureStudent(studentId) {
  const doc = await Student.exists({ _id: studentId });
  if (!doc) throw new AppError('Student not found', 404);
}

export async function createInvoice(req, res, next) {
  try {
    const payload = req.validated.body;
    await ensureStudent(payload.student);
    const doc = await Invoice.create(payload);
    const data = await doc.populate({
      path: 'student',
      select: 'enrollmentNo semester section user',
      populate: { path: 'user', select: 'fullName email role' }
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function listInvoices(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.validated.query);
    const { student, status } = req.validated.query;
    const query = {};
    if (student) query.student = student;
    if (status) query.status = status;

    const [data, total] = await Promise.all([
      Invoice.find(query)
        .populate({
          path: 'student',
          select: 'enrollmentNo semester section user',
          populate: { path: 'user', select: 'fullName email role' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query)
    ]);

    return res.status(200).json({ success: true, data, pagination: formatPagination({ page, limit, total }) });
  } catch (error) {
    return next(error);
  }
}

export async function getInvoiceById(req, res, next) {
  try {
    const doc = await Invoice.findById(req.validated.params.id).populate({
      path: 'student',
      select: 'enrollmentNo semester section user',
      populate: { path: 'user', select: 'fullName email role' }
    });

    if (!doc) throw new AppError('Invoice not found', 404);
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return next(error);
  }
}

export async function updateInvoice(req, res, next) {
  try {
    const doc = await Invoice.findByIdAndUpdate(req.validated.params.id, req.validated.body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'student',
      select: 'enrollmentNo semester section user',
      populate: { path: 'user', select: 'fullName email role' }
    });

    if (!doc) throw new AppError('Invoice not found', 404);
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return next(error);
  }
}

export async function deleteInvoice(req, res, next) {
  try {
    const doc = await Invoice.findByIdAndDelete(req.validated.params.id);
    if (!doc) throw new AppError('Invoice not found', 404);
    return res.status(200).json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    return next(error);
  }
}
