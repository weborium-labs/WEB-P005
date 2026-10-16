import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
} from "passport-google-oauth20";
import { OAuthError } from "../utils/OAuthError.js";
import config from "./config.js";
import User from "../models/user.model.js";

interface GoogleProfileData {
  email?: string;
  email_verified?: boolean;
  verified_email?: boolean;
}

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: config.googleCallbackUrl,
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const googleData =
          profile._json as unknown as GoogleProfileData;

        const email = (
          profile.emails?.[0]?.value ?? googleData.email
        )
          ?.trim()
          .toLowerCase();

        // Ensure Google supplied an email.
        if (!email) {
          return done(
            null,
            false,
            new OAuthError(
              "EMAIL_NOT_AVAILABLE",
              "Email not provided by Google"
            )
          );
        }

        // Require a verified Google email.
        const emailVerified =
          googleData.email_verified === true ||
          googleData.verified_email === true;

        if (!emailVerified) {
          return done(
            null,
            false,
            new OAuthError(
              "EMAIL_NOT_VERIFIED",
              "Google email address is not verified"
            )
          );
        }

        // Only the configured owner may authenticate.
        const ownerEmail = config.ownerEmail.trim().toLowerCase();

        if (email !== ownerEmail) {
          return done(
            null,
            false,
            new OAuthError(
              "OWNER_EMAIL_NOT_ALLOWED",
              "This Google account is not authorized"
            )
          );
        }

        // Find the existing owner account.
        const user = await User.findOne({ email });

        if (!user) {
          return done(
            null,
            false,
            new OAuthError(
              "OWNER_ACCOUNT_NOT_FOUND",
              "The owner account has not been initialized"
            )
          );
        }

        // Never replace a Google account already linked
        // to a different identity.
        if (user.googleId && user.googleId !== profile.id) {
          return done(
            null,
            false,
            new OAuthError(
              "GOOGLE_ACCOUNT_ALREADY_LINKED",
              "A different Google account is already linked"
            )
          );
        }

        // Link Google to the existing owner account.
        user.googleId = profile.id;

        const avatarUrl = profile.photos?.[0]?.value;

        if (avatarUrl) {
          user.avatar_url = avatarUrl;
        }

        await user.save();

        return done(null, user);
      } catch (error: unknown) {
        return done(
          error instanceof Error
            ? error
            : new Error("Google OAuth authentication failed")
        );
      }
    }
  )
);

export default passport;