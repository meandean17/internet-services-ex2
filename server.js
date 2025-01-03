import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/auth.js';
import courseRoutes from './src/routes/courses.js';

// load env variables
dotenv.config();

// initialize express
const app = express();

// connect to mongo
connectDB();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

// test route
app.get('/', (req, res) => {
    res.json({ message: 'Course Registration API' });
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// handle promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // close server
    server.close(() => process.exit(1));
});