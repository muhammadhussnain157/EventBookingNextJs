import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Event from '@/models/Event';
import { getAuthUser } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

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

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    const date = formData.get('date') as string;
    const ticketPrice = parseFloat(formData.get('ticketPrice') as string);
    const totalTickets = parseInt(formData.get('totalTickets') as string);
    const image = formData.get('image') as File;

    // Validate required fields
    if (!name || !description || !category || !location || !date || !ticketPrice || !totalTickets) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Upload image if provided
    let imageUrl = '';
    if (image) {
      imageUrl = await uploadImage(image, 'event_images');
    }

    // Create event
    const event = await Event.create({
      name,
      description,
      category,
      location,
      date: new Date(date),
      ticketPrice,
      totalTickets,
      availableTickets: totalTickets,
      imageUrl,
      createdBy: authUser.userId,
    });

    return NextResponse.json(event, { status: 201 });

  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
