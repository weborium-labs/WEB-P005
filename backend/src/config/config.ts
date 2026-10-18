import dotenv from 'dotenv';
dotenv.config();

const config = {
    frontendUrl: process.env.FRONTEND_URL || '',
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