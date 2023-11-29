import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  try {
    const connectionInstance = await mongoose.connect(`${mongoURI}/${DB_NAME}`);
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (err) {
    console.log("MongoDb Connection Error!!!", err);
    process.exit(1);
  }
};

export default connectDB;
