import dotenv from 'dotenv';
dotenv.config();

const config = {
    frontendUrl: process.env.FRONTEND_URL || '',
    adminUrl: process.env.ADMIN_URL || process.env.FRONTEND_URL || '',
    // Single source of truth for browser origins allowed to talk to this
    // server (CORS) and to receive the post-OAuth redirect. The fallback
    // includes the admin dev origin so an unset FRONTEND_URLS never locks
    // the admin panel out.
    frontendUrls: (process.env.FRONTEND_URLS ||
        'http://localhost:5173,http://localhost:5174,http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/myapp',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    googleCallbackUrlTryAgain : process.env.GOOGLE_CALLBACK_URL_TRY_AGAIN || 'http://localhost:3000/auth/google/callback',
    ownerEmail: process.env.OWNER_EMAIL || '',
    jwtSecret: process.env.JWT_SECRET || '',
    accessTokenExpiryTime: process.env.ACCESS_TOKEN_EXPIRY_TIME || '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshTokenExpiryTime: process.env.REFRESH_TOKEN_EXPIRY_TIME || '7d',
}

export default config;