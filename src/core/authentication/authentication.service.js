  import BaseService from '../../base/service.base.js';
  import { Forbidden, NotFound, BadRequest } from '../../exceptions/catch.execption.js';
  import { compare, hash } from '../../helpers/bcrypt.helper.js';
  import jwt, { decode } from 'jsonwebtoken';
  import { generateAccessToken, generateRefreshToken,} from '../../helpers/jwt.helper.js';
  import prisma from '../../config/prisma.db.js';
  import { createClient } from '@supabase/supabase-js';

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE // atau ANON_KEY tergantung kebutuhan
    );
  
  class AuthenticationService extends BaseService {
    constructor() {
      super(prisma);
    }

    
  login = async (payload) => {
    const { identifier, password } = payload;

    if (!identifier) throw new BadRequest("Email or username is required");
    if (!password) throw new BadRequest("Password is required");

    // Deteksi apakah identifier adalah email
    const isEmail = identifier.includes("@");

    // Cari user berdasarkan email ATAU username
    const user = await this.db.users.findUnique({
      where: isEmail
        ? { email: identifier }
        : { username: identifier },
    });

    if (!user) throw new NotFound("Account not found");

    // Cek password
    const pwValid = await compare(password, user.password);
    if (!pwValid) throw new BadRequest("Password is incorrect");

    // Token
    const access_token = await generateAccessToken(user);
    const refresh_token = await generateRefreshToken(user);

    return {
      user: this.exclude(user, ["password"]),
      token: { access_token, refresh_token },
    };  
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
  const { username, email, password, bio } = payload || {};

  // VALIDASI INPUT
  if (!email) throw new BadRequest("Email is required");
  if (!password) throw new BadRequest("Password is required");

  // CEK EMAIL
  const existing = await this.db.users.findUnique({ where: { email } });
  if (existing) throw new Forbidden("Email already registered");

  // 🔥 Ambil daftar avatar dari Supabase folder new_avatar
  const { data: files, error: listError } = await supabase.storage
    .from("image")
    .list("new_avatar", { limit: 100 });

  if (listError) {
    console.error(listError);
    throw new Error("Failed to load random avatars");
  }

  if (!files || files.length === 0) {
    throw new Error("No avatars found in Supabase folder 'new_avatar'");
  }

  // 🔥 Pilih avatar secara random
  const randomFile = files[Math.floor(Math.random() * files.length)].name;

  // 🔥 Buat public URL
  const { data: publicURLData } = supabase.storage
    .from("image")
    .getPublicUrl(`new_avatar/${randomFile}`);

  const randomAvatarUrl = publicURLData.publicUrl;

  // 🔥 INSERT USER
  const user = await this.db.users.create({
    data: {
      username,
      email,
      password: await hash(password, 10),
      profile_image: randomAvatarUrl,
      bio: bio ?? null,
    },
  });

  // SANITIZED RETURN
  const sanitized = {
    id: user.id,
    username: user.username,
    email: user.email,
    profile_image: user.profile_image,
    bio: user.bio,
    id_role: user.id_role,
    status: user.status,
    created_at: user.created_at,
  };

  return {
    data: sanitized,
    message: "Account successfully registered",
  };
};


  updateUser = async (id, payload) => {
    const { username, bio, profile_image } = payload;

    // 1. Pastikan user ada
    const user = await this.db.users.findUnique({ where: { id } });
    if (!user) throw new NotFound("User not found");

    // 2. Jika tidak ada data yang dikirim, tolak
    if (!username && !bio && !profile_image) {
      throw new BadRequest("At least one field must be provided to update");
    }

    // 3. Jika username ingin diubah → cek apakah sudah dipakai orang lain
    if (username) {
      const existingUsername = await this.db.users.findFirst({
        where: {
          username,
          NOT: { id }
        }
      });

      if (existingUsername) {
        throw new Forbidden("Username already in use by another user");
      }
    }

    // 4. Lanjut update
    const updated = await this.db.users.update({
      where: { id },
      data: {
        username: username ?? user.username,
        bio: bio ?? user.bio,
        profile_image: profile_image ?? user.profile_image,
      },
    });

    // 5. Sanitasi → hilangkan field sensitif
    const sanitized = {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      bio: updated.bio,
      profile_image: updated.profile_image,
      created_at: updated.created_at,
    };

    return {
      data: sanitized,
      message: "Profile updated successfully",
    };
  };




  }

  export default AuthenticationService;
