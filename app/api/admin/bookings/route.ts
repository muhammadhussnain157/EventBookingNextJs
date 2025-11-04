import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

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

    // Check if user is admin
    const user = await User.findById(authUser.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('eventId', 'name date location')
      .sort({ createdAt: -1 });

    return NextResponse.json(bookings);

  } catch (error: any) {
    console.error('Get admin bookings error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
