import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import Event from '@/models/Event';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { eventId, quantity } = await request.json();

    // Validate input
    if (!eventId || !quantity || quantity < 1) {
      return NextResponse.json(
        { message: 'Invalid booking details' },
        { status: 400 }
      );
    }

    // Validate max 5 tickets per booking
    if (quantity > 5) {
      return NextResponse.json(
        { message: 'Maximum 5 tickets allowed per booking' },
        { status: 400 }
      );
    }

    // Get event
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Check availability
    if (event.availableTickets < quantity) {
      return NextResponse.json(
        { message: 'Not enough tickets available' },
        { status: 400 }
      );
    }

    // Generate ticket ID
    const ticketId = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create booking
    const booking = await Booking.create({
      userId: authUser.userId,
      eventId,
      ticketId,
      quantity,
      totalAmount: event.ticketPrice * quantity,
      status: 'confirmed',
    });

    // Update available tickets
    event.availableTickets -= quantity;
    await event.save();

    // Populate event details
    await booking.populate('eventId');

    return NextResponse.json(booking, { status: 201 });

  } catch (error: any) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
