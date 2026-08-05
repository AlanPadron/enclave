// Mongoose stub. Wire a real connection here when MONGO_URI is set.
export async function connectDB() {
  if (process.env.MONGO_URI) {
    // const mongoose = await import('mongoose')
    // await mongoose.connect(process.env.MONGO_URI)
    console.log('[db] MONGO_URI provided — wire mongoose here')
  } else {
    console.log('[db] in-memory store (no MONGO_URI)')
  }
}
