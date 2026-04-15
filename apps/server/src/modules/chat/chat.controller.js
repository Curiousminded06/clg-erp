import { ChatMessage } from '../../models/chat-message.model.js';
import { Course } from '../../models/course.model.js';
import { AppError } from '../../utils/AppError.js';
import { formatPagination, getPagination } from '../../utils/pagination.js';

export async function listChatCourses(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.validated.query);

    const [data, total] = await Promise.all([
      Course.find({})
        .populate('department', 'name code')
        .sort({ code: 1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments({})
    ]);

    return res.status(200).json({
      success: true,
      data,
      pagination: formatPagination({ page, limit, total })
    });
  } catch (error) {
    return next(error);
  }
}

export async function listCourseMessages(req, res, next) {
  try {
    const { courseId } = req.validated.params;
    const { limit } = req.validated.query;

    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) {
      throw new AppError('Course not found', 404);
    }

    const messages = await ChatMessage.find({ course: courseId })
      .populate('sender', 'fullName email role')
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    return next(error);
  }
}
