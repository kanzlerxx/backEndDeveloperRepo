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

    login = this.wrapper(async (req, res) => {
  const data = await this.#service.login(req.body);

  // encrypt token
  const accessEnc = encrypt(data.token.access_token);
  const refreshEnc = encrypt(data.token.refresh_token);

  // set cookies
  res.cookie("cookies_access_token", accessEnc, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 15,
  });

  res.cookie("cookies_refresh_token", refreshEnc, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  // 👇 TAMBAHAN UNTUK DEBUG
  return this.ok(
    res,
    {
      user: data.user,
      access_token: data.token.access_token,       // token asli (sementara)
      cookies_access_token: accessEnc,            // versi terenkripsi
    },
    "Login success"
  );
});



     refresh = this.wrapper(async (req, res) => {
    const encryptedRefresh = req.cookies.cookies_refresh_token;

    if (!encryptedRefresh) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // 🔓 decrypt cookie refresh token
    const refreshToken = decrypt(encryptedRefresh);

    // 🔄 minta token baru
    const data = await this.#service.refreshToken(refreshToken);

    // 🔐 encrypt token baru
    const newAccessEnc = encrypt(data.token.access_token);
    const newRefreshEnc = encrypt(data.token.refresh_token);

    // 🥠 set ulang cookie
    res.cookie("cookies_access_token", newAccessEnc, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 15,
    });

    res.cookie("cookies_refresh_token", newRefreshEnc, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.json({
      message: "Token refreshed",
      user: data.user,
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
  res.clearCookie("cookies_access_token");
  res.clearCookie("cookies_refresh_token");

  return res.json({ message: "Logged out" });
});
  }

  export default AuthenticationController;