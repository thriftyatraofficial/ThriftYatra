import bcrypt from 'bcryptjs';

const BCRYPT_PREFIX = /^\$2[aby]\$/;

export const isPasswordHash = (value = '') => BCRYPT_PREFIX.test(value);

export const hashPassword = async (password) => bcrypt.hash(password, 12);

export const verifyPassword = async (password, storedPassword = '') => {
    if (!storedPassword) return false;
    if (isPasswordHash(storedPassword)) return bcrypt.compare(password, storedPassword);
    return password === storedPassword;
};
