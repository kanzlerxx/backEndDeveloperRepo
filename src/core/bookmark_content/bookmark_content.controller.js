import BaseController from "../../base/controller.base.js";
import { NotFound } from "../../exceptions/catch.execption.js";
import bookmark_contentService from "./bookmark_content.service.js";

class bookmark_contentController extends BaseController {
  #service;

  constructor() {
    super();
    this.#service = new bookmark_contentService();
  }

  findAll = this.wrapper(async (req, res) => {
    const data = await this.#service.findAll(req.query);
    return this.ok(res, data, "bookmark_contents successfully retrieved");
  });

  findById = this.wrapper(async (req, res) => {
    const data = await this.#service.findById(req.params.id);
    if (!data) throw new NotFound("bookmark_content not found");

    return this.ok(res, data, "bookmark_content successfully retrieved");
  });

  create = this.wrapper(async (req, res) => {
    const data = await this.#service.create(req.body);
    return this.created(res, data, "bookmark_content successfully created");
  });

  update = this.wrapper(async (req, res) => {
    const data = await this.#service.update(req.params.id, req.body);
    return this.ok(res, data, "bookmark_content successfully updated");
  });

  delete = this.wrapper(async (req, res) => {
    const data = await this.#service.delete(req.params.id);
    return this.noContent(res, "bookmark_content successfully deleted");
  });
}

export default bookmark_contentController;
