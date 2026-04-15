import mongoose from 'mongoose';

const campusUpdateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['event', 'achievement'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 4000
    },
    date: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

campusUpdateSchema.index({ type: 1, date: -1 });
campusUpdateSchema.index({ createdAt: -1 });

export const CampusUpdate = mongoose.model('CampusUpdate', campusUpdateSchema);
