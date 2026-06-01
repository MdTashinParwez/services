import mongoose ,{Schema} from 'mongoose';


const notificationSchema = new Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'booking_request',
        'booking_accepted',
        'booking_rejected',
        'booking_cancelled',
        'service_completed',
        'payment_confirmed',
        'payment_failed',
        'review_received',
        'new_message',
        'provider_verified',
        'service_approved',
        'system_alert',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      bookingId: mongoose.Schema.Types.ObjectId,
      serviceId: mongoose.Schema.Types.ObjectId,
      providerId: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    action: {
      
      text: String,
      url: String,
    },
  },
  { timestamps: true }
);



export const Notification = mongoose.model('Notification', notificationSchema);
