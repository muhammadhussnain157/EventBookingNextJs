import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookings = await Booking.find({ userId: authUser.userId })
      .populate('eventId')
      .sort({ createdAt: -1 });

    return NextResponse.json(bookings);

  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
