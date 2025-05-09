import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI // Store your connection string in .env
const MONGODB_DB = process.env.MONGODB_DB // Name of the database

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so the MongoClient isn't repeatedly created during hot reloading
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's better to not use a global variable
  clientPromise = MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}

export async function connectToDatabase() {
  const client = await clientPromise
  const db = client.db(MONGODB_DB)
  return { client, db }
}
