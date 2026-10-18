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
        const googleData = profile._json as unknown as GoogleProfileData;

        const email = (profile.emails?.[0]?.value ?? googleData.email)
          ?.trim()
          .toLowerCase();

        if (!email) {
          return done(
            null,
            false,
            new OAuthError(
              "EMAIL_NOT_AVAILABLE",
              "Email not provided by Google",
            ),
          );
        }

        const emailVerified =
          googleData.email_verified === true ||
          googleData.verified_email === true;

        if (!emailVerified) {
          return done(
            null,
            false,
            new OAuthError(
              "EMAIL_NOT_VERIFIED",
              "Google email address is not verified",
            ),
          );
        }

        // First, find an account already linked to this Google ID.
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          const avatarUrl = profile.photos?.[0]?.value;

          if (avatarUrl && user.avatar_url !== avatarUrl) {
            user.avatar_url = avatarUrl;
            await user.save();
          }

          return done(null, user);
        }

        // If an account exists with this email, link the Google ID.
        user = await User.findOne({ email });

        if (user) {
          if (user.googleId && user.googleId !== profile.id) {
            return done(
              null,
              false,
              new OAuthError(
                "GOOGLE_ACCOUNT_ALREADY_LINKED",
                "A different Google account is already linked",
              ),
            );
          }

          user.googleId = profile.id;

          const avatarUrl = profile.photos?.[0]?.value;
          if (avatarUrl) user.avatar_url = avatarUrl;

          await user.save();

          return done(null, user);
        }

        // No existing account: create a normal user.
        user = await User.create({
          display_name: profile.displayName || email.split("@")[0],
          email,
          googleId: profile.id,
          avatar_url: profile.photos?.[0]?.value,
          role: "user",
        });

        return done(null, user);
      } catch (error: unknown) {
        return done(
          error instanceof Error
            ? error
            : new Error("Google OAuth authentication failed"),
        );
      }
    },
  ),
);

export default passport;
