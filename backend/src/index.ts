import express from "express";
import "./load-env.js";
import { Request, Response } from "express";
import v1Router from "./router/api-v1.router.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import config from "./config/config.js";
import { connectToDatabase } from "./config/database.js";

const app = express();

const port = config.port || 3000;

app.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .json(new ApiResponse(200, "", "Weborium - P005 server is running.."));
});

app.use("/api/v1", v1Router);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log("Weborium - POO5 is listening on port:", port);
    });
  })
  .catch((err) => {
    throw new Error(err);
  });
