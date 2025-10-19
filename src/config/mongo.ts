import mongoose from 'mongoose';
import config from './config';

export async function connectMongo() {

    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}
