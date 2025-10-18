import mongoose from 'mongoose';

export async function connectMongo() {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/onchainhub';

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}
