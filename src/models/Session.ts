import mongoose, { Document, Schema } from 'mongoose';
import { SessionData } from '../types';


export interface ISession extends SessionData, Document {
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema: Schema = new Schema({
  sessionId: { type: String, unique: true, required: true },
  phoneNumber: { type: String, required: true },
  cookies: Array,
  url: String,
  domSnapshot: String,
  apiSessionDetails: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISession>('Session', sessionSchema);