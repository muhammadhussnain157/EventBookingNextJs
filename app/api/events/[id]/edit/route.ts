import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Event from '@/models/Event';
import User from '@/models/User';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenPayload = await getAuthUser();

    if (!tokenPayload) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(tokenPayload.userId);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, description, category, location, date, ticketPrice, totalTickets, imageUrl } = body;

    // Validate required fields
    if (!name || !description || !category || !location || !date || !ticketPrice || !totalTickets) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Find the event
    const event = await Event.findById(params.id);

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Calculate tickets sold
    const ticketsSold = event.totalTickets - event.availableTickets;

    // Validate that new total tickets is not less than tickets already sold
    if (totalTickets < ticketsSold) {
      return NextResponse.json(
        { message: `Cannot reduce total tickets below ${ticketsSold}. ${ticketsSold} tickets have already been sold.` },
        { status: 400 }
      );
    }

    // Calculate new available tickets
    const newAvailableTickets = totalTickets - ticketsSold;

    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      params.id,
      {
        name,
        description,
        category,
        location,
        date,
        ticketPrice,
        totalTickets,
        availableTickets: newAvailableTickets,
        ...(imageUrl && { imageUrl }), // Only update image if provided
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error('Event update error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}
