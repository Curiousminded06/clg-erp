import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'student'],
      default: 'student'
    }
  },
  { timestamps: true }
);

userSchema.index({ fullName: 'text', email: 'text', role: 'text' });

export const User = mongoose.model('User', userSchema);
