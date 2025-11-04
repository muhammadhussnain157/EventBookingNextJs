import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Event from '@/models/Event';
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

    // Check if user is admin
    const user = await User.findById(authUser.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    // Get statistics
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    // Get revenue
    const bookings = await Booking.find({ status: 'confirmed' });
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('eventId', 'name date')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming events
    const upcomingEvents = await Event.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(5);

    // Get bookings by status
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Get bookings by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const bookingsByMonth = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalEvents,
        totalBookings,
        totalRevenue,
        confirmedBookings,
        cancelledBookings,
        pendingBookings,
      },
      recentBookings,
      upcomingEvents,
      bookingsByMonth,
    });

  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
