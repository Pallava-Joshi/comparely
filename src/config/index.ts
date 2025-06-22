import dotenv from 'dotenv';
import selectors from './selectors.json'; 
import { PlatformSelectors } from '../types'; 

dotenv.config();

interface Config {
  PORT: number;
  REDIS_URL: string;
  MONGO_URI: string;
  SELECTORS: PlatformSelectors; 
}

const config: Config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/grocery_automation',
  SELECTORS: selectors as PlatformSelectors 
};

export default config;