import mongoose from 'mongoose';

const connection: { isConnected?: number } = {};

export async function connectDB() {
  if (connection.isConnected) {
    console.log('✅ Using existing database connection');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI!);
    connection.isConnected = db.connections[0].readyState;
    
    console.log('✅ MongoDB connected:', db.connection.host);
    console.log('📊 Database:', db.connection.name);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
  } catch (error: any) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    throw new Error('Database connection failed');
  }
}
