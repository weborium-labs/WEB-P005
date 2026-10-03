import express from "express";
import "./load-env.js";
import { Request, Response } from "express";
import defaultRouter from "./router/default.router.js";
import { ApiResponse } from "./utils/ApiResponse.js";

const app = express();

const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .json(new ApiResponse(200, "", "Weborium - P005 server is running.."));
});

app.use("/api/v1", defaultRouter);

app.listen(port, () => {
  console.log("Weborium - POO5 is listening on port:", port);
});
