import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEvent extends Document {
  _id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  date: Date;
  imageUrl: string;
  ticketPrice: number;
  totalTickets: number;
  availableTickets: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Music', 'Sports', 'Arts', 'Tech', 'Food', 'Business', 'Other'],
      default: 'Other',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    ticketPrice: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: 0,
    },
    totalTickets: {
      type: Number,
      required: [true, 'Total tickets is required'],
      min: 1,
    },
    availableTickets: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Set availableTickets to totalTickets before saving if not set
eventSchema.pre('save', function (next) {
  if (this.isNew && this.availableTickets === undefined) {
    this.availableTickets = this.totalTickets;
  }
  next();
});

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);

export default Event;
