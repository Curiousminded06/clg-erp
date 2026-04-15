import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 3000
    },
    audience: {
      type: String,
      enum: ['all', 'students', 'faculty'],
      default: 'all'
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ audience: 1, department: 1, expiresAt: 1 });

export const Notice = mongoose.model('Notice', noticeSchema);
