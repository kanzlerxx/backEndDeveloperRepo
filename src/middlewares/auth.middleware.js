import httpStatus from 'http-status-codes';
import { ApiError } from '../exceptions/errors.exception.js';
import { verifyToken } from '../helpers/jwt.helper.js';
import { Unauthenticated } from '../exceptions/catch.execption.js';
import prisma from '../config/prisma.db.js';
import { decrypt } from "../helpers/encryption.helper.js";

export default function auth(roles) {

  return async (req, res, next) => {
    try {

      const encryptedToken = req.cookies?.cookies_access_token;

      if (!encryptedToken) {
        return next(
          new ApiError(
            httpStatus.StatusCodes.UNAUTHORIZED,
            'NO_AUTHORIZATION',
            'Please Authenticate'
          )
        );
      }

      // 🔓 DECRYPT TOKEN DULU
      let token;
      try {
        token = decrypt(encryptedToken);
      } catch (err) {
        return next(new Unauthenticated("Invalid encrypted token"));
      }

      // 🔍 VERIFY JWT
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (e) {
        return next(new Unauthenticated("Invalid or expired token"));
      }

      // 🔎 Cari user
      const user = await prisma.users.findFirst({
        where: { id: decoded.userId },
        include: { role_users: true },
      });

      if (!user) {
        return next(
          new ApiError(
            httpStatus.StatusCodes.UNAUTHORIZED,
            'NO_DATA',
            'Please Authenticate'
          )
        );
      }

      // 🔐 Cek role jika perlu
      if (roles && roles.length > 0) {
        const userRoleCodes = user.role_users.map(r => r.roles.code);
        const hasAccess = roles.some(allowedRole =>
          userRoleCodes.includes(allowedRole)
        );

        if (!hasAccess) {
          return next(
            new ApiError(
              httpStatus.StatusCodes.FORBIDDEN,
              'NO_ACCESS',
              'Unauthorized'
            )
          );
        }
      }

      req.user = user;
      next();

    } catch (e) {
      if (e.message === 'jwt expired') {
        return next(
          new ApiError(
            httpStatus.StatusCodes.UNAUTHORIZED,
            'NO_ACCESS',
            'Expired Login Session'
          )
        );
      }

      console.error(e);
      return next(e);
    }
  };
}
