import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      minlength: 2,
      maxlength: 24
    },
    creditHours: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    }
  },
  { timestamps: true }
);

courseSchema.index({ title: 'text', code: 'text' });

export const Course = mongoose.model('Course', courseSchema);
