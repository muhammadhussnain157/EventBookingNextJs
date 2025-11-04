import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Event from '@/models/Event';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    let query: any = {};

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search by name or location
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Only show future events
    query.date = { $gte: new Date() };

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: 1 })
      .limit(limit)
      .skip(skip);

    const total = await Event.countDocuments(query);

    return NextResponse.json({
      events,
      total,
      hasMore: skip + events.length < total,
    });

  } catch (error: any) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
