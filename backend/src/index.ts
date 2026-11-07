import express from "express";
import "./load-env.js";
import { NextFunction, Request, Response } from "express";
import v1Router from "./router/api-v1.router.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import { ApiError } from "./utils/ApiError.js";
import config from "./config/config.js";
import { connectToDatabase } from "./config/database.js";
import NavRouter from "./router/nav.router.js";
import PublicationRouter from "./router/publication.routes.js";
import GlimpseRouter from "./router/glimpse.routes.js";
import PageRouter from "./router/page.routes.js";
import MediaRouter from "./router/media.routes.js";
import StatsRouter from "./router/stats.routes.js";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
const app = express();

const port = config.port || 3000;

// Browser origins allowed by CORS; shared with the post-OAuth redirect
// guard in user.router via config.frontendUrls.
const allowedOrigins = config.frontendUrls;

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
// 1 MB: page documents carry the complete editable content of a page (hero
// copy, section arrays, SEO), which routinely exceeds a 16 KB ceiling.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .json(new ApiResponse(200, "", "Weborium - P005 server is running.."));
});

app.use("/api/v1", v1Router);
app.use("/api/v1",NavRouter);
app.use("/api/v1", PublicationRouter);
app.use("/api/v1", GlimpseRouter);
app.use("/api/v1", PageRouter);
app.use("/api/v1", MediaRouter);
app.use("/api/v1", StatsRouter);

// Terminal JSON error handler: converts errors forwarded via next(err)
// (auth middleware, Multer, Passport, body parser, CORS) into the standard
// ApiError JSON shape instead of Express's default HTML error page.
app.use(
  (
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void | Response => {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err instanceof ApiError) {
      // Log name/status/message only: ApiError payloads are safe, but keep a
      // single consistent format that can never print whole error objects.
      console.error(`[ERROR] ${err.name}: ${err.statusCode} ${err.message}`);
      res.status(err.statusCode).json(err);
      return;
    }

    const error = err as
      | {
          name?: string;
          code?: string | number;
          kind?: string;
          type?: string;
          message?: string;
          statusCode?: number;
        }
      | undefined;

    let statusCode = 500;
    let message = "Internal Server Error";

    if (error?.name === "MulterError") {
      statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Upload too large: maximum file size is 10 MB."
          : error.message || "Invalid upload request.";
    } else if (error?.type === "entity.too.large") {
      statusCode = 413;
      message = "Request payload too large.";
    } else if (
      typeof error?.message === "string" &&
      error.message.startsWith("Unexpected end of form")
    ) {
      // Busboy: the multipart stream ended before a single part completed
      // (e.g. an empty multipart POST) — a client error, not a server error.
      statusCode = 400;
      message = "Malformed multipart form data.";
    } else if (
      typeof error?.message === "string" &&
      error.message.startsWith("CORS Error")
    ) {
      statusCode = 403;
      message = error.message;
    } else if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "TokenExpiredError"
    ) {
      statusCode = 401;
      message = "Unauthorized: Invalid or expired token";
    } else if (error?.name === "CastError" && error?.kind === "ObjectId") {
      // A malformed ObjectId in a route/query parameter is a missing resource,
      // not a server fault — without this it escapes as an unhandled 500.
      statusCode = 404;
      message = "Resource not found.";
    } else if (error?.name === "MongoServerError" && error?.code === 11000) {
      statusCode = 409;
      message = "A record with that unique value already exists.";
    } else if (error?.name === "OAuthError") {
      statusCode = 401;
      message = error.message || "Authentication failed";
    } else if (typeof error?.statusCode === "number") {
      statusCode = error.statusCode;
      message = error.message || message;
    }

    // Never log full error objects here: they can carry credentials or tokens.
    console.error(`[ERROR] ${error?.name ?? "Error"}: ${message}`);

    res.status(statusCode).json(new ApiError(statusCode, message));
  },
);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log("Weborium - POO5 is listening on port:", port);
    });
  })
  .catch((err) => {
    throw new Error(err);
  });
