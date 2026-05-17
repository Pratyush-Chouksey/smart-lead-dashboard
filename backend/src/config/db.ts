import mongoose from 'mongoose'

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables')
  }

  try {
    const conn = await mongoose.connect(uri, {
      // These are the recommended defaults for Mongoose 7+
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    console.log(`✅  MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`❌  MongoDB connection error: ${message}`)
    process.exit(1)
  }
}

export default connectDB
