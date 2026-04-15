import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    enrollmentNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      minlength: 3,
      maxlength: 40
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    dob: {
      type: Date,
      required: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

studentSchema.index({ enrollmentNo: 'text', section: 'text', phone: 'text', address: 'text' });

export const Student = mongoose.model('Student', studentSchema);
