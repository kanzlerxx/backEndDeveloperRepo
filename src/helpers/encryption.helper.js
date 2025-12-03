import crypto from "crypto";

const ALGO = "aes-256-gcm";
const SECRET = Buffer.from(process.env.COOKIE_SECRET, "utf8");

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, SECRET, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}:${tag}:${encrypted}`;
}

export function decrypt(encryptedText) {
  const [ivStr, tagStr, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivStr, "base64");
  const tag = Buffer.from(tagStr, "base64");

  const decipher = crypto.createDecipheriv(ALGO, SECRET, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
