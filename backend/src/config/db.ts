import mongoose from 'mongoose';

export async function connectDB(url: string): Promise<void> {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  await mongoose.connect(url);
  console.log('MongoDB connected');
}
