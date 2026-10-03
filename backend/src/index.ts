import express from "express";
import "./load-env.js";
import { Request, Response } from "express";
import defaultRouter from "./router/default.router.js";

const app = express();

const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Weborium - P005 server is running..");
});

app.use("/api/v1", defaultRouter);

app.listen(port, () => {
  console.log("Weborium - POO5 is listening on port:", port);
});
