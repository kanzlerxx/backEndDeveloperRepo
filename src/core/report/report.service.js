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
        users_report_userd_id_report_toTousers: true
      }
    });

    if (query.paginate) {
      const countData = await this.db.report.count({ where: q.where });
      return this.paginate(data, countData, q);
    }

    return data;
  };

  findById = async (id) => {
    const data = await this.db.report.findUnique({
      where: { id: Number(id) },
      include: {
        users_report_user_id_report_byTousers: true,
        users_report_userd_id_report_toTousers: true
      }
    });

    return data;
  };

  create = async (payload) => {
    const data = await this.db.report.create({
      data: {
        report_option: payload.report_option,
        report_description: payload.report_description,
        user_id_report_by: payload.user_id_report_by,
        userd_id_report_to: payload.userd_id_report_to
      }
    });

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
