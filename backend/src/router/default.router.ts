import { Router } from "express";
import { Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Weborium - P005 API v1 is running..");
});

export default router;
