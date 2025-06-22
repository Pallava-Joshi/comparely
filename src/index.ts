import express, { Application, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import { connectDB } from './services/mongoService';
import config from './config';

const app: Application = express();


app.use(bodyParser.json());
connectDB();

app.use('/api', authRoutes);
app.use('/api', productRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ status: 'ERROR', message: err.message || 'Something went wrong!' });
});

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});