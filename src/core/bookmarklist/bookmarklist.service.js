import BaseService from "../../base/service.base.js";
import prisma from '../../config/prisma.db.js';

class bookmarklistService extends BaseService {
  constructor() {
    super(prisma);
  }

  findAll = async (query) => {
    const q = this.transformBrowseQuery(query);
    const data = await this.db.bookmark_list.findMany({ ...q });

    if (query.paginate) {
      const countData = await this.db.bookmark_list.count({ where: q.where });
      return this.paginate(data, countData, q);
    }
    return data;
  };

  findById = async (id) => {
    const data = await this.db.bookmark_list.findUnique({   where: { id: Number(id)} });
    return data;
  };

  create = async (payload) => {
    const data = await this.db.bookmark_list.create({ data: payload });
    return data;
  };

  update = async (id, payload) => {
    const data = await this.db.bookmark_list.update({ where: { id }, data: payload });
    return data;
  };
    addThread = async (userId, payload) => {
    const { bookmark_content_id, threads_id } = payload;

    // Pastikan folder milik user
    const folder = await this.db.bookmark_content.findFirst({
      where: { id: bookmark_content_id, user_id: userId }
    });
    if (!folder) throw new Forbidden("You do not own this folder");

    // Cegah duplikasi thread dalam folder
    const exists = await this.db.bookmark_list.findUnique({
      where: {
        bookmark_content_id_threads_id: {
          bookmark_content_id,
          threads_id
        }
      }
    });

    if (exists) throw new Forbidden("Thread already saved in this folder");

    return await this.db.bookmark_list.create({
      data: {
        bookmark_content_id,
        threads_id
      }
    });
  };

  // Hapus thread dari folder
  removeThread = async (userId, payload) => {
    const { bookmark_content_id, threads_id } = payload;

    // Pastikan folder milik user
    const folder = await this.db.bookmark_content.findFirst({
      where: { id: bookmark_content_id, user_id: userId }
    });
    if (!folder) throw new Forbidden("You do not own this folder");

    return await this.db.bookmark_list.delete({
      where: {
        bookmark_content_id_threads_id: {
          bookmark_content_id,
          threads_id
        }
      }
    });
  };

  // Ambil semua thread dalam folder tersebut
  getThreadsInFolder = async (userId, folderId) => {
    // Pastikan user punya folder ini
    const folder = await this.db.bookmark_content.findFirst({
      where: { id: folderId, user_id: userId }
    });
    if (!folder) throw new Forbidden("You do not own this folder");

    // Ambil threads
    return await this.db.bookmark_list.findMany({
      where: { bookmark_content_id: folderId },
      include: {
        threads: true
      }
    });
  };

  delete = async (id) => {
    const data = await this.db.bookmark_list.delete({ where: { id } });
    return data;
  };

   getFoldersByUserId = async (userId) => {
    const folders = await this.db.bookmark_content.findMany({
      where: { user_id: userId },
      include: {
        bookmark_list_bookmark_list_bookmark_content_idTobookmark_content: {
          include: {
            threads: true
          }
        }
      }
    });

    return folders;
  };


}

export default bookmarklistService;  
