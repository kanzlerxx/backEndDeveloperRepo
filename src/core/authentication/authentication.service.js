import BaseService from '../../base/service.base.js';
import { Forbidden, NotFound, BadRequest } from '../../exceptions/catch.execption.js';
import { compare, hash } from '../../helpers/bcrypt.helper.js';
import jwt, { decode } from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken,} from '../../helpers/jwt.helper.js';
import prisma from '../../config/prisma.db.js';

class AuthenticationService extends BaseService {
  constructor() {
    super(prisma);
  }

  login = async (payload) => {
    const user = await this.db.users.findUnique({
      where: { email: payload.email },
    });
    if (!user) throw new NotFound('Account not found');

    const pwValid = await compare(payload.password, user.password);
    if (!pwValid) throw new BadRequest('Password is incorrect');  


    const access_token = await generateAccessToken(user);
    const refresh_token = await generateRefreshToken(user)
    return { user: this.exclude(user, ['password', 'isVerified']), token: {access_token, refresh_token} };
  };

  refreshToken = async (refresh) => {
    const payload = jwt.decode(refresh);

    const user = await this.db.users.findUnique({
      where: { email: payload.email },
    });
    if (!user) throw new NotFound('Account not found');

    const access_token = await generateAccessToken(user);
    const refresh_token = await generateRefreshToken(user)
    return { user: this.exclude(user, ['password', 'isVerified']), token: {access_token, refresh_token} };
  };

  register = async (payload) => {
    const { email, password, ...others } =
      payload;

    const existing = await this.db.users.findUnique({ where: { email } });
    if (existing) throw new Forbidden('Email has been registered');
    const data = await this.db.users.create({
      data: {
        email,
        password: await hash(password, 10)
        
      },
    });
    
  // hilangkan field sensitif (opsional, sesuaikan dengan kebutuhan)
  const sanitized = this.exclude(data, ['password', 'isVerified']);

    return {
      data: sanitized,
      message: 'Account successfully registered, please login to continue',
    };
  };

 
}

export default AuthenticationService;
