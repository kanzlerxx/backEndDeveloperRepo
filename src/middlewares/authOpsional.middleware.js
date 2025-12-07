import { decrypt } from "../helpers/encryption.helper.js";
import { verifyToken } from "../helpers/jwt.helper.js";
import prisma from "../config/prisma.db.js";

export default async function authOptional(req, res, next) {
  try {
    const encryptedToken = req.cookies?.cookies_access_token;

    // 🔹 Jika tidak ada token → user = null → guest
    if (!encryptedToken) {
      req.user = null;
      return next();
    }

    // 🔹 decrypt token
    let token;
    try {
      token = decrypt(encryptedToken);
    } catch (err) {
      req.user = null;
      return next();
    }

    // 🔹 verify JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      req.user = null;
      return next();
    }

    // 🔹 ambil user dari DB
    const user = await prisma.users.findFirst({
      where: { id: decoded.userId },
      include: { role_users: true },
    });

    // jika user tidak ditemukan → treat sebagai guest
    if (!user) {
      req.user = null;
      return next();
    }

    // 🔹 simpan user ke req
    req.user = user;

    next();

  } catch (e) {
    console.error("authOptional error:", e);
    req.user = null;
    next();
  }
}
