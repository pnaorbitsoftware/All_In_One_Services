import { MongoClient } from "mongodb";

const uri = "mongodb://127.0.0.1:27017/";
const dbName = "all_in_one_services";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const count = await db.collection("bookings").countDocuments();
    console.log("Total bookings count:", count);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

run();
