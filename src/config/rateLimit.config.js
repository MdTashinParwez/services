export const RATE_LIMITS = {
    login: {
        keyPrefix: "rate-limit:login",
        limit: 5,
        windowInSeconds: 60,
    },

    register: {
        keyPrefix: "rate-limit:register",
        limit: 5,
        windowInSeconds: 60 * 60,
    },

    forgotPassword: {
        keyPrefix: "rate-limit:forgot-password",
        limit: 3,
        windowInSeconds: 60 * 60,
    },
    changePassword: {
    keyPrefix: "rate-limit:change-password",
    limit: 5,
    windowInSeconds: 15 * 60,
}
};