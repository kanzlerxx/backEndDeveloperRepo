  import BaseService from "../../base/service.base.js";
  import prisma from "../../config/prisma.db.js";
  import { createClient } from "@supabase/supabase-js";
  import { NotFound } from "../../exceptions/catch.execption.js";

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE // atau ANON_KEY tergantung kebutuhan
  );

  class usersService extends BaseService {
    constructor() {
      super(prisma);
    }

    //digunakan untuk melihat semua user
   findAll = async (query) => {
  const q = this.transformBrowseQuery(query);

  // Hapus limit & offset agar semua data keluar
  delete q.take;
  delete q.skip;

  // Jika paginate ON → tetap gunakan paginate
  if (query.paginate) {
    const data = await this.db.users.findMany({ ...q });
    const countData = await this.db.users.count({ where: q.where });

    return this.paginate(data, countData, q);
  }

  // Jika paginate OFF → tampilkan semua
  return await this.db.users.findMany({ ...q });
    };

    //digunakan untuk mencari user berdasarkan id
    findById = async (id) => {
      const data = await this.db.users.findUnique({where: { id: Number(id) } });
      return data;
    };


    //untuk update user
  updateUser = async (id, { username, bio }, file) => {
    // 1. Cek user
    const user = await this.db.users.findUnique({ where: { id } });
    if (!user) throw new NotFound("User not found");

    // 2. Validasi username jika dikirim → cek apakah duplikat
    if (username) {
      const existingUsername = await this.db.users.findFirst({
        where: {
          username,
          NOT: { id }
        },
      });
      if (existingUsername) throw new Forbidden("Username already in use");
    }

    let newProfileImage = user.profile_image;

    // 3. Jika upload file → hapus foto lama + upload baru
    if (file) {
      // Hapus foto lama (jika bukan default)
      if (
        user.profile_image &&
        !user.profile_image.includes("default")
      ) {
        const relativePath = user.profile_image.replace(
          `${process.env.SUPABASE_URL}/storage/v1/object/public/image/`,
          ""
        );

        if (relativePath.startsWith("users/")) {
          await supabase.storage.from("image").remove([relativePath]);
        }
      }

      // Upload foto baru
      const uploadPath = `users/${id}-${Date.now()}`;
      const { data, error } = await supabase.storage
        .from("image")
        .upload(uploadPath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) throw new Error("Upload failed: " + error.message);

      newProfileImage = supabase.storage
        .from("image")
        .getPublicUrl(uploadPath).data.publicUrl;
    }

    // 4. Update user
    const updated = await this.db.users.update({
      where: { id },
      data: {
        username: username ?? user.username,
        bio: bio ?? user.bio,
        profile_image: newProfileImage,
      },
    });

    // 5. Kembalikan response model seperti login
    return {
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        profile_image: updated.profile_image,
        bio: updated.bio,
        status: updated.status,
        created_at: updated.created_at,
        id_role: updated.id_role,
        duration: updated.duration,
      },
      message: "Profile updated successfully"
    };
  };


    //digunakan untuk delete user
    delete = async (id) => {
      const data = await this.db.users.delete({ where: { id } });
      return data;
    };
  }

  export default usersService;  