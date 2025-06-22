import mongoose from 'mongoose';
import config from '../config';
import Session, { ISession } from '../models/Session'; // Import the interface as well
import { SessionData } from '../types';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

export async function saveSessionToMongo(sessionData: SessionData): Promise<ISession> {
  const { sessionId, phoneNumber, cookies, url, domSnapshot, apiSessionDetails } = sessionData;
  const session = await Session.findOneAndUpdate(
    { sessionId },
    { phoneNumber, cookies, url, domSnapshot, apiSessionDetails, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return session;
}

export async function getSessionFromMongo(sessionId: string): Promise<ISession | null> {
  return await Session.findOne({ sessionId });
}