import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { generateTokens, setAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, password, name, role, adminPin } = await request.json();

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Handle admin role
    let finalRole = 'customer';
    if (role === 'admin') {
      if (adminPin !== process.env.ADMIN_PIN) {
        return NextResponse.json(
          { message: 'Invalid admin PIN' },
          { status: 403 }
        );
      }
      finalRole = 'admin';
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
