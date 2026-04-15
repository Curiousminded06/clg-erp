import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, sanitizeUser } from '../auth/auth.service.js';

function toPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1
  };
}

export async function listFaculty(req, res, next) {
  try {
    const { page, limit, search } = req.validated.query;
    const query = { role: 'faculty' };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: data.map((user) => sanitizeUser(user)),
      pagination: toPagination(page, limit, total)
    });
  } catch (error) {
    return next(error);
  }
}

export async function createFaculty(req, res, next) {
  try {
    const { fullName, email, password } = req.validated.body;
    const existing = await User.findOne({ email: email.toLowerCase() }).lean();

    if (existing) {
      throw new AppError('Email already exists', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role: 'faculty'
    });

    return res.status(201).json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
}