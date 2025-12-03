  import BaseController from '../../base/controller.base.js';
  import { NotFound } from '../../exceptions/catch.execption.js';
  import AuthenticationService from './authentication.service.js';

  class AuthenticationController extends BaseController {
    #service;

    constructor() {
      super();
      this.#service = new AuthenticationService();
    }

    login = this.wrapper(async (req, res) => {
  const data = await this.#service.login(req.body);

  const { access_token, refresh_token } = data.token;

  // SET COOKIE KE NAMA BARU
  res.cookie("cookies_access_token", access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 15 // 15 menit
  });

  res.cookie("cookies_refresh_token", refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 hari
  });

  return res.status(200).json({
    message: "Selamat Kamu Telah Berhasil Login",
    user: data.user
  });
});


    refresh = this.wrapper(async (req, res) => {
  const refreshToken = req.cookies.cookies_refresh_token;

  const data = await this.#service.refreshToken(refreshToken);

  res.cookie("cookies_access_token", data.token.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 15
  });

  res.cookie("cookies_refresh_token", data.token.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });

  return res.json({
    message: "Token refreshed",
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
  res.clearCookie("cookies_access_token");
  res.clearCookie("cookies_refresh_token");

  return res.json({ message: "Logged out" });
});





  }

  export default AuthenticationController;
