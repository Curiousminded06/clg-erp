import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    examType: {
      type: String,
      enum: ['quiz', 'midterm', 'final', 'practical'],
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    maxMarks: {
      type: Number,
      min: 1,
      max: 1000,
      required: true
    }
  },
  { timestamps: true }
);

examSchema.index({ course: 1, examType: 1, date: 1 }, { unique: true });
examSchema.index({ date: 1, examType: 1 });

export const Exam = mongoose.model('Exam', examSchema);
