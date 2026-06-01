import mongoose ,{Schema} from 'mongoose';

const paymentSchema = new Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'razorpay', 'wallet', 'credit_card', 'debit_card', 'upi'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    transactionId: String, // Stripe or Razorpay transaction ID
    orderId: String, // Razorpay order ID
    receiptId: String,
    paymentIntentId: String, // Stripe Payment Intent ID
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    failureReason: String,
  },
  { timestamps: true }
);

paymentSchema.index({ customer: 1 });
paymentSchema.index({ provider: 1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ transactionId: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
