import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['none', 'card', 'upi', 'bank-transfer', 'cash'],
      default: 'none'
    },
    paymentReference: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

invoiceSchema.index({ status: 1, dueDate: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
