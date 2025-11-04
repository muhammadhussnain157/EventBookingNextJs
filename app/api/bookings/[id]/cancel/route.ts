import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import Event from '@/models/Event';
import { getAuthUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { cancelQuantity } = await request.json();

    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking
    if (booking.userId.toString() !== authUser.userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { message: 'Booking already cancelled' },
        { status: 400 }
      );
    }

    // Validate cancel quantity
    if (!cancelQuantity || cancelQuantity < 1 || cancelQuantity > booking.quantity) {
      return NextResponse.json(
        { message: 'Invalid cancellation quantity' },
        { status: 400 }
      );
    }

    // Restore available tickets
    const event = await Event.findById(booking.eventId);
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    event.availableTickets += cancelQuantity;
    await event.save();

    // If cancelling all tickets, mark as cancelled
    if (cancelQuantity === booking.quantity) {
      booking.status = 'cancelled';
      booking.cancellationRequested = true;
      await booking.save();
    } else {
      // Partial cancellation - reduce quantity and update total amount
      booking.quantity -= cancelQuantity;
      booking.totalAmount = booking.quantity * event.ticketPrice;
      await booking.save();
    }

    return NextResponse.json({
      message: `${cancelQuantity} ticket(s) cancelled successfully`,
      booking
    });

  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
