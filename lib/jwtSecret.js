export const getJwtSecret = () => {
    if (!process.env.SECRET_KEY) {
        throw new Error('SECRET_KEY is not configured');
    }

    return new TextEncoder().encode(process.env.SECRET_KEY);
};
