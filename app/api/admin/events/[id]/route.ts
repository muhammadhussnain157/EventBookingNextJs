import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Event from '@/models/Event';
import Booking from '@/models/Booking';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

export async function DELETE(
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

    // Check if user is admin
    const user = await User.findById(authUser.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Cancel all related bookings
    await Booking.updateMany(
      { eventId: params.id, status: 'confirmed' },
      { status: 'cancelled', cancellationRequested: true }
    );

    // Delete the event
    await Event.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Event deleted successfully' });

  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
