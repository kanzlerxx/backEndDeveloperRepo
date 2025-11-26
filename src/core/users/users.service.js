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


    findById = async (id) => {
      const data = await this.db.users.findUnique({where: { id: Number(id) } });
      return data;
    };

    create = async (payload) => {
      const data = await this.db.users.create({ data: payload });
      return data;
    };

    update = async (id, payload) => {
      const data = await this.db.users.update({ where: { id }, data: payload });
      return data;
    };

    
    updateProfilePhoto = async (id, file) => {
  const user = await this.db.users.findUnique({ where: { id } });
  if (!user) throw new NotFound("User not found");

  // Hapus foto lama jika ada
if (user.profile_image && !user.profile_image.includes("default")) {
  // Ambil relative path dari URL Supabase
  const relativePath = user.profile_image.replace(
    `${process.env.SUPABASE_URL}/storage/v1/object/public/image/`,
    ""
  );

  // Hanya hapus jika foto berada di folder users/
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

  const url = supabase.storage
    .from("image")
    .getPublicUrl(uploadPath).data.publicUrl;

  // Update database
  return await this.db.users.update({
    where: { id },
    data: { profile_image: url },
  });
};


    delete = async (id) => {
      const data = await this.db.users.delete({ where: { id } });
      return data;
    };
  }

  export default usersService;  