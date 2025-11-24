import BaseController from "../../base/controller.base.js";
import { NotFound } from "../../exceptions/catch.execption.js";
import usersService from "./users.service.js";

class usersController extends BaseController {
  #service;

  constructor() {
    super();
    this.#service = new usersService();
  }

  findAll = this.wrapper(async (req, res) => {
    const data = await this.#service.findAll(req.query);
    return this.ok(res, data, "userss successfully retrieved");
  });

  findById = this.wrapper(async (req, res) => {
    const data = await this.#service.findById(req.params.id);
    if (!data) throw new NotFound("users not found");

    return this.ok(res, data, "users successfully retrieved");
  });

  create = this.wrapper(async (req, res) => {
    const data = await this.#service.create(req.body);
    return this.created(res, data, "users successfully created");
  });

  update = this.wrapper(async (req, res) => {
    const data = await this.#service.update(req.params.id, req.body);
    return this.ok(res, data, "users successfully updated");
  });
  
    updateProfilePhoto = this.wrapper(async (req, res) => {
      const data = await this.#service.updateProfilePhoto(req.user.id, req.file);
      return this.ok(res, data, "Profile photo updated");
    });

  delete = this.wrapper(async (req, res) => {
    const data = await this.#service.delete(req.params.id);
    return this.noContent(res, "users successfully deleted");
  });
}

export default usersController;
