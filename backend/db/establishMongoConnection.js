import mongoose from "mongoose";

const establishMongoConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connecting due to ", error);
  }
};

export default establishMongoConnection;
