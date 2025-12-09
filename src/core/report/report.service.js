import BaseService from "../../base/service.base.js";
import prisma from "../../config/prisma.db.js";
import { NotFound } from "../../exceptions/catch.execption.js";

class reportService extends BaseService {
  constructor() {
    super(prisma);
  }

  findAll = async (query) => {
    const q = this.transformBrowseQuery(query);

    const data = await this.db.report.findMany({
    ...q,
    include: {
      users_report_user_id_report_byTousers: true,
      users_report_user_id_report_toTousers: true
    }
  });


    if (query.paginate) {
      const countData = await this.db.report.count({ where: q.where });
      return this.paginate(data, countData, q);
    }

    return data;
  };

  findById = async (id) => {
   const data = await this.db.report.findMany({
  ...q,
  include: {
    users_report_user_id_report_byTousers: true,
    users_report_user_id_report_toTousers: true
  }
});


    return data;
  };

  create = async (payload) => {
  const reporter = payload.user_id_report_by;
  const target = payload.user_id_report_to;
  let countForTarget;

  // 1. No self-report
  if (reporter === target) {
    throw new Error("You cannot report your own account");
  }

  // 2. Cek apakah reporter sudah pernah report target
  const existing = await this.db.report.findFirst({
    where: {
      user_id_report_by: reporter,
      user_id_report_to: target
    }
  });

  if (existing) {
    return existing; 
  }

  // 3. Create report
  const data = await this.db.report.create({
    data: {
      report_option: payload.report_option,
      report_description: payload.report_description,
      user_id_report_by: payload.user_id_report_by,
      user_id_report_to: payload.user_id_report_to
    }
  });

  // 4. Hitung total unique report yang masuk ke target
  const uniqueCount = await this.db.report.count({
    where: { user_id_report_to: target }
  });

  // 5. Delete akun jika menyentuh 6 report
  if (uniqueCount >= 6) {
    await this.db.users.delete({ where: { id: target } });
    return data;
  }

  // 6. Ban sementara jika menyentuh 3 report
  if (uniqueCount >= 3) {
    const banDurationHours = 24;
    const bannedUntil = new Date(Date.now() + banDurationHours * 60 * 60 * 1000);


    await this.db.users.update({
      where: { id: target },
      data: {
        status: false,
        duration: bannedUntil

      }
    });
  }

  return data;
};


  update = async (id, payload) => {
    const exist = await this.db.report.findUnique({
      where: { id: Number(id) }
    });

    if (!exist) throw new NotFound("report not found");

    const data = await this.db.report.update({
      where: { id: Number(id) },
      data: payload
    });

    return data;
  };

  delete = async (id) => {
    const exist = await this.db.report.findUnique({
      where: { id: Number(id) }
    });

    if (!exist) throw new NotFound("report not found");

    await this.db.report.delete({ where: { id: Number(id) } });

    return { message: "report deleted" };
  };
}

export default reportService;
