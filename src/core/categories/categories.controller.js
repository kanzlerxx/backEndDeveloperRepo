import BaseController from "../../base/controller.base.js";
import { NotFound } from "../../exceptions/catch.execption.js";
import categoriesService from "./categories.service.js";

class categoriesController extends BaseController {
  #service;

  constructor() {
    super();
    this.#service = new categoriesService();
  }

  findAll = this.wrapper(async (req, res) => {
    const data = await this.#service.findAll(req.query);
    return this.ok(res, data, "categoriess successfully retrieved");
  });

  findById = this.wrapper(async (req, res) => {
    const data = await this.#service.findById(req.params.id);
    if (!data) throw new NotFound("categories not found");

    return this.ok(res, data, "categories successfully retrieved");
  });

  create = this.wrapper(async (req, res) => {
    const data = await this.#service.create(req.body);
    return this.created(res, data, "categories successfully created");
  });

  update = this.wrapper(async (req, res) => {
    const data = await this.#service.update(req.params.id, req.body);
    return this.ok(res, data, "categories successfully updated");
  });

  delete = this.wrapper(async (req, res) => {
    const data = await this.#service.delete(req.params.id);
    return this.noContent(res, "categories successfully deleted");
  });
}

export default categoriesController;
