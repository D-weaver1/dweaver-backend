export const ACCESS_TOKEN_EXPIRES_IN = "15m";

export const REFRESH_TOKEN_EXPIRES_DAYS = 7;

export const REFRESH_COOKIE_NAME = "refreshToken";

export const ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET || "dev_access_secret_change_me";
