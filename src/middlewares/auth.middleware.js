import httpStatus from 'http-status-codes';
import { ApiError } from '../exceptions/errors.exception.js';
import { verifyToken } from '../helpers/jwt.helper.js';
import { Unauthenticated } from '../exceptions/catch.execption.js';
import prisma from '../config/prisma.db.js';

export default function auth(roles) {
  return async (req, res, next) => {
    try {
      // Extract token from authorization header 
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return next(
          new ApiError(
            httpStatus.StatusCodes.UNAUTHORIZED,
            'NO_AUTHORIZATION',
            'Please Authenticate'
          )
        );
      }
      
      const parts = authHeader.split(' ');
      const token = parts[1];
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
        // If token invalid or expired, throw error
        return next(new Unauthenticated('Invalid or expired token'));
      }
      
      // Find user by decoded token
      const user = await prisma.users.findFirst({
        where: { id: decoded.userId },
        include: { roles: true } // Get role relations
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
      
      // If roles parameter is provided, check is user has related role or not
      if (roles && roles.length > 0) {
        const userRoleCodes = user.roles.map(role => role.code);
        const hasAccess = roles.some(allowedRole => userRoleCodes.includes(allowedRole));
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
