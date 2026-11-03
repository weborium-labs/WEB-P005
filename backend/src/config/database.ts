import mongoose from "mongoose";
import config from "./config.js";

export const connectToDatabase = async (): Promise<void> => {
  try {
    console.log("Connecting to database...");

    const dbConnection = await mongoose.connect(config.databaseUrl);

    console.log(
      `Database connection successful at ${dbConnection.connection.host}`,
    );

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected! Attempting to reconnect...");
    });
  } catch (error: unknown) {
    console.error("Database connection error:", error);
    throw error;
  }
};
