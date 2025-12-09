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
            'Please Login First'
          )
        );
      }

      // Decrypt cookie → JWT string
      let token;
      try {
        token = decrypt(encryptedToken);
      } catch (err) {
        return next(new Unauthenticated("Invalid encrypted token"));
      }

      // Verify JWT
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (err) {
        return next(new Unauthenticated("Invalid or expired token"));
      }

      const userId = decoded?.userId;
      if (!userId) {
        return next(new Unauthenticated("Teu login"));
      }

      req.userId = userId;

      // Fetch user
      const user = await prisma.users.findFirst({
        where: { id: userId },
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

      // =====================================================================
      // CHECK BAN STATUS
      // =====================================================================

      // 1. Jika sedang diban dan waktunya belum lewat → block login
      if (user.status === false) {
  if (user.duration && user.duration > new Date()) {
    return next(
      new Unauthenticated(
        "Your account is temporarily banned until " + user.duration
      )
    );
  }
}


      // 2. Jika ban sudah lewat → auto unban
      if (user.status === false && user.duration && user.duration <= new Date()) {
  await prisma.users.update({
    where: { id: user.id },
    data: {
      status: true,
      duration: null  
    }
  });
  user.status = true;
}


      // =====================================================================

      // Role check
      if (roles && roles.length > 0) {
        const userRoleCodes = user.role_users.map(r => r.roles.code);
        const hasAccess = roles.some(r => userRoleCodes.includes(r));

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
