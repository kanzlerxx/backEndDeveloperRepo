import BaseService from "../../base/service.base.js";
import prisma from '../../config/prisma.db.js';

class usersService extends BaseService {
  constructor() {
    super(prisma);
  }

  findAll = async (query) => {
    const q = this.transformBrowseQuery(query);
    const data = await this.db.users.findMany({ ...q });

    if (query.paginate) {
      const countData = await this.db.users.count({ where: q.where });
      return this.paginate(data, countData, q);
    }
    return data;
  };

  findById = async (id) => {
    const data = await this.db.users.findUnique({ where: { id } });
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

  // 1. jika foto lama adalah custom, hapus
  if (user.photo && !user.photo.includes("default")) {
    await supabase.storage.from("profiles").remove([ user.photo ]);
  }

  // 2. upload foto baru
  const uploadPath = `users/${id}-${Date.now()}`;
  const { data, error } = await supabase.storage
    .from("profiles")
    .upload(uploadPath, file.buffer);

  // 3. ambil public URL
  const url = supabase.storage.from("profiles").getPublicUrl(uploadPath).data.publicUrl;

  // 4. update database
  return await this.db.users.update({
    where: { id },
    data: { photo: url },
  });
};

  delete = async (id) => {
    const data = await this.db.users.delete({ where: { id } });
    return data;
  };
}

export default usersService;  
