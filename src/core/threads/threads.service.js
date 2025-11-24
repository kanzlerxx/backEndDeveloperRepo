import BaseService from "../../base/service.base.js";
import prisma from '../../config/prisma.db.js';

class threadsService extends BaseService {
  constructor() {
    super(prisma);
  }

  findAll = async (query) => {
    const q = this.transformBrowseQuery(query);

  //    if (query.paginate) {
  //   const page = parseInt(query.page) || 1;
  //   q.take = 5;
  //   q.skip = (page - 1) * 5;  
  // }

  const data = await this.db.threads.findMany({ ...q });
  // const countData = await this.db.threads.count({ where: q.where });
  // return this.paginate(data, countData, q);

  return data;

  };

  findAllRandom = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = 5;

    // Ambil semua data dulu
    let data = await this.db.threads.findMany();

    // Randomize data
    data = data.sort(() => Math.random() - 0.5);

    // Paginate
    const start = (page - 1) * limit;
    const paginated = data.slice(start, start + limit);

    return {
      data: paginated,
      total: data.length,
      page,
      totalPages: Math.ceil(data.length / limit),
    };
  };

  findByUserId = async (user_id, query) => {
    const page = parseInt(query.page) || 1;
    

    const data = await this.db.threads.findMany({
      where: { user_id: Number(user_id) },
    });

    const count = await this.db.threads.count({
      where: { user_id: Number(user_id) },
    });

    return {
      data,
      total: count,
      page,
      totalPages: Math.ceil(count),
    };
  };

  findById = async (id) => {
    const data = await this.db.threads.findUnique({ where: { id } });
    return data;
  };

  create = async (payload) => {
    const data = await this.db.threads.create({ data: payload });
    return data;
  };

  update = async (id, payload) => {
    const data = await this.db.threads.update({ where: { id }, data: payload });
    return data;
  };



  delete = async (id) => {
    const data = await this.db.threads.delete({ where: { id } });
    return data;
  };
}

export default threadsService;  
