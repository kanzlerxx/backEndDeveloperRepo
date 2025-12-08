import BaseService from "../../base/service.base.js";
import prisma from '../../config/prisma.db.js';

class bookmark_contentService extends BaseService {
  constructor() {
    super(prisma);
  }

  findAll = async (query) => {
    const q = this.transformBrowseQuery(query);
    const data = await this.db.bookmark_content.findMany({ ...q });

    if (query.paginate) {
      const countData = await this.db.bookmark_content.count({ where: q.where });
      return this.paginate(data, countData, q);
    }
    return data;
  };

  findById = async (id) => {
    const data = await this.db.bookmark_content.findUnique({   where: { id: Number(id)} });
    return data;
  };

  create = async (userId, payload) => {
    let { bookmark_name, color } = payload;

    // Pastikan name exist
    if (!bookmark_name || bookmark_name.trim() === "") {
      throw new Error("bookmark_name is required");
    }

    // Normalisasi
    const normalizedName = bookmark_name.trim().toLowerCase();

    // Cek folder dengan nama yang SAMA (case insensitive)
    const exists = await this.db.bookmark_content.findFirst({
      where: {
        user_id: userId,
        bookmark_name: {
          equals: normalizedName,
          mode: "insensitive"
        }
      }
    });

    if (exists) {
      throw new Error("Folder name already used");
    }

    // Create folder
    const data = await this.db.bookmark_content.create({
      data: {
        user_id: userId,
        bookmark_name: normalizedName, // terserah kamu mau simpan uppercase atau lowercase
        color
      }
    });

    return data;
  };


  update = async (id, payload) => {
    const data = await this.db.bookmark_content.update({ where: { id }, data: payload });
    return data;
  };

  delete = async (id) => {
    const data = await this.db.bookmark_content.delete({ where: { id } });
    return data;
  };
}

export default bookmark_contentService;  
