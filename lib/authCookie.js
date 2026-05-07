const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24;

export const setAuthCookie = (res, token) => {
    res.cookies.set('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    return res;
};
