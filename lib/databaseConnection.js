import mongoose from "mongoose";
const MONGODB_URL = process.env.MONGODB_URI

let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    }
}

export const connectDB = async () => {
    if (!MONGODB_URL) {
        throw new Error('MONGODB_URI is not configured');
    }

    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URL, {
            dbName: 'ThriftYatra',
            bufferCommands: false
        })
    }

    cached.conn = await cached.promise

    return cached.conn
}
