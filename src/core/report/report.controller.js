import BaseController from "../../base/controller.base.js";
import { NotFound } from "../../exceptions/catch.execption.js";
import reportService from "./report.service.js";

class reportController extends BaseController {
  #service;

  constructor() {
    super();
    this.#service = new reportService();
  }

  findAll = this.wrapper(async (req, res) => {
    const data = await this.#service.findAll(req.query);
    return this.ok(res, data, "reports successfully retrieved");  
  });

  findById = this.wrapper(async (req, res) => {
    const data = await this.#service.findById(req.params.id);
    if (!data) throw new NotFound("report not found");

    return this.ok(res, data, "report successfully retrieved");
  });

  create = this.wrapper(async (req, res) => {
  const targetId = Number(req.params.id);
  const reporterId = req.userId;  // dari auth()

  const payload = {
    ...req.body,
    user_id_report_by: reporterId,
    user_id_report_to: targetId
  };
  console.log("REQ BODY >>", req.body);
console.log("PARAMS >>", req.params);
console.log("USER ID >>", req.userId);


  const data = await this.#service.create(payload);

  return this.created(res, data, "report successfully created");
});
  

  update = this.wrapper(async (req, res) => {
    const data = await this.#service.update(req.params.id, req.body);
    return this.ok(res, data, "report successfully updated");
  });

  delete = this.wrapper(async (req, res) => {
    await this.#service.delete(req.params.id);
    return this.noContent(res, "report successfully deleted");
  });
}

export default reportController;
