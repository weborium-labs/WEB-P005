import config from "../config/config.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NextFunction, Request, Response } from "express";

export const healthCheck = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    return res
      .status(200)
      .json(new ApiResponse(200, "", "Weborium - P005 API v1 is running.."));
  },
);


export const authFailureRedirect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Unable to Sign In</title>

          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                Roboto, sans-serif;
              background: #f8fafc;
              color: #0f172a;
            }

            .error-card {
              width: 100%;
              max-width: 420px;
              padding: 40px 32px;
              text-align: center;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(15, 23, 42, 0.07);
            }

            .icon {
              width: 64px;
              height: 64px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
              border-radius: 50%;
              background: #fef2f2;
              color: #dc2626;
            }

            .icon svg {
              width: 32px;
              height: 32px;
            }

            h1 {
              margin-bottom: 12px;
              font-size: 25px;
              font-weight: 700;
              letter-spacing: -0.7px;
            }

            .description {
              margin-bottom: 24px;
              color: #64748b;
              font-size: 15px;
              line-height: 1.7;
            }

            .notice {
              margin-bottom: 28px;
              padding: 14px;
              border-radius: 10px;
              background: #f8fafc;
              color: #475569;
              font-size: 13px;
              line-height: 1.6;
            }

            .retry-button {
              display: block;
              width: 100%;
              padding: 14px 20px;
              border-radius: 10px;
              background: #0f172a;
              color: #ffffff;
              text-decoration: none;
              font-size: 14px;
              font-weight: 600;
              transition: background 0.2s ease;
            }

            .retry-button:hover {
              background: #334155;
            }

            .footer {
              margin-top: 24px;
              color: #94a3b8;
              font-size: 12px;
            }

            @media (max-width: 480px) {
              .error-card {
                padding: 32px 24px;
              }

              h1 {
                font-size: 23px;
              }
            }
          </style>
        </head>

        <body>
          <main class="error-card">
            <div class="icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>

            <h1>Unable to sign in</h1>

            <p class="description">
              We couldn't sign you in with Google.
              Please try again.
            </p>

            <div class="notice">
              Your account has not been changed.
              You can safely retry signing in.
            </div>

            <a class="retry-button" href=${config.googleCallbackUrlTryAgain}>
              Try again
            </a>

            <p class="footer">
              Having trouble? Please try again later.
            </p>
          </main>
        </body>
      </html>
    `);
  }
);
