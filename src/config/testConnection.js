import connectDB from "./database.js";
import dotenv from "dotenv";

dotenv.config();

const testConnection = async () => {
    try {
        await connectDB();
        console.timeLog('Database connection test successful');
        process.exit(0);
    } catch (error) {
        console.error('Database connection test failed: ', error);
        process.exit(1);
    }
};

testConnection();