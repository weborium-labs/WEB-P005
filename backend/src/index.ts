import express from "express";
import "./load-env.js";
import { Request, Response } from "express";
import v1Router from "./router/api-v1.router.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import config from "./config/config.js";
import { connectToDatabase } from "./config/database.js";
import NavRouter from "./router/nav.router.js";
import PublicationRouter from "./router/publication.routes.js";
import GlimpseRouter from "./router/glimpse.routes.js";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
const app = express();

const port = config.port || 3000;

const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS Error: Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true, // Needed if you use cookies or Authorization headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .json(new ApiResponse(200, "", "Weborium - P005 server is running.."));
});

app.use("/api/v1", v1Router);
app.use("/api/v1",NavRouter);
app.use("/api/v1", PublicationRouter);
app.use("/api/v1", GlimpseRouter);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log("Weborium - POO5 is listening on port:", port);
    });
  })
  .catch((err) => {
    throw new Error(err);
  });
