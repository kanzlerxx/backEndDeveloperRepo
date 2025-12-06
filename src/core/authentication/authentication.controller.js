import BaseController from '../../base/controller.base.js';
  import { NotFound } from '../../exceptions/catch.execption.js';
  import AuthenticationService from './authentication.service.js';
import { encrypt, decrypt } from "../../helpers/encryption.helper.js";


  class AuthenticationController extends BaseController {
    #service;

    constructor() {
      super();
      this.#service = new AuthenticationService();
    }

  me = this.wrapper(async (req, res) => {
  const user = await this.#service.getUserById(req.user.id);


  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return this.ok(res, { user });
});


  login = this.wrapper(async (req, res) => {
  const data = await this.#service.login(req.body);

  // encrypt token (kamu sudah pakai helper encrypt)
  const accessEnc = encrypt(data.token.access_token);
  const refreshEnc = encrypt(data.token.refresh_token);

  // set cookies (sesuaikan flags)
  res.cookie("cookies_access_token", accessEnc, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 15,
  });

  res.cookie("cookies_refresh_token", refreshEnc, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  if (data.user.refresh_token) {
    delete data.user.refresh_token;
  }

  return res.json({
  message: "Login success",
  token: {
    access_token: data.token.access_token
  },
  user: data.user
});

});

refresh = this.wrapper(async (req, res) => {
  const encryptedRefresh = req.cookies.cookies_refresh_token;

  if (!encryptedRefresh) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  const refreshToken = decrypt(encryptedRefresh);

  const data = await this.#service.refreshToken(refreshToken);

  const newAccessEnc = encrypt(data.token.access_token);
  const newRefreshEnc = encrypt(data.token.refresh_token);

  // 🔥 Set cookie dengan refresh token baru
  res.cookie("cookies_access_token", newAccessEnc, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 1000,  
  });

  res.cookie("cookies_refresh_token", newRefreshEnc, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  if (data.user.refresh_token) {
    delete data.user.refresh_token; 
  }

 return res.json({
  message: "Token refreshed",
  token: {
    access_token: data.token.access_token
  },
  user: data.user
});

});






    register = this.wrapper(async (req, res) => {
      const data = await this.#service.register(req.body);
      return this.ok(res, data, 'Registration successful');
    });  
    
    update = this.wrapper(async (req, res) => {
      const data = await this.#service.updateUser(req.body);
      return this.ok(res, data, 'Registration successful');
    });

    logout = this.wrapper(async (req, res) => {
  // jika kamu punya user id di req.user (dari middleware auth), revoke di DB
  if (req.user && req.user.id) {
    await this.#service.revokeRefreshToken(req.user.id);
  }

  res.clearCookie("cookies_access_token");
  res.clearCookie("cookies_refresh_token");

  return res.json({ message: "Logged out" });
});
  }

  export default AuthenticationController;