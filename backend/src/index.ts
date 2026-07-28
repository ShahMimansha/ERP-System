import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customer/customer.routes';
import productRoutes from './modules/product/product.routes';
import challanRoutes from './modules/challan/challan.routes';
import errorHandler from './middleware/errorHandler';
import AppError from './utils/AppError';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again in 15 minutes.',
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});

app.all('*', (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
