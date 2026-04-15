import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
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
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    maxPoints: {
      type: Number,
      min: 1,
      max: 1000,
      default: 100
    }
  },
  { timestamps: true }
);

assignmentSchema.index({ department: 1, course: 1, dueDate: -1 });
assignmentSchema.index({ faculty: 1, createdAt: -1 });
assignmentSchema.index({ title: 'text', description: 'text' });

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 5000
    },
    attachmentUrl: {
      type: String,
      trim: true,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['submitted', 'graded'],
      default: 'submitted'
    },
    grade: {
      type: Number,
      min: 0,
      max: 1000,
      default: null
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    gradedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
assignmentSubmissionSchema.index({ student: 1, submittedAt: -1 });
assignmentSubmissionSchema.index({ assignment: 1, submittedAt: -1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);
export const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
