import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBooking extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  ticketId: string;
  quantity: number;
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'pending';
  cancelledQuantity: number;
  cancellationRequested: boolean;
  bookingDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending'],
      default: 'confirmed',
    },
    cancelledQuantity: {
      type: Number,
      default: 0,
    },
    cancellationRequested: {
      type: Boolean,
      default: false,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
