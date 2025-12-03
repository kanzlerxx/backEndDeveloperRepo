import httpStatus from 'http-status-codes';
import { ApiError } from '../exceptions/errors.exception.js';
import { verifyToken } from '../helpers/jwt.helper.js';
import { Unauthenticated } from '../exceptions/catch.execption.js';
import prisma from '../config/prisma.db.js';

export default function auth(roles) {

  return async (req, res, next) => {
    try {
      // 🔥 Ambil token dari COOKIE, bukan lagi dari header!!
      const token = req.cookies?.cookies_access_token;

      if (!token) {
        return next(
          new ApiError(
            httpStatus.StatusCodes.UNAUTHORIZED,
            'NO_AUTHORIZATION',
            'Please Authenticate'
          )
        );
      }

      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (e) {
        return next(new Unauthenticated("Invalid or expired token"));
      }

      // 🔍 Cari user berdasarkan decoded token
      const user = await prisma.users.findFirst({
        where: { id: decoded.userId },
        include: {
          role_users: true,
        },
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

      // 🔐 Cek role jika diperlukan
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

      // 🔥 Simpan user ke req
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
