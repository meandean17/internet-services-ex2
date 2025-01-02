import mongoose, { mongo } from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // ensure stable connection
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// handle errors 
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error: ', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// handle termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection: ', err);
        process.exit(1);
    }
});

export default connectDB;
