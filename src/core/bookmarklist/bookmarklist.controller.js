import BaseController from "../../base/controller.base.js";
import { NotFound } from "../../exceptions/catch.execption.js";
import bookmarklistService from "./bookmarklist.service.js";

class bookmarklistController extends BaseController {
  #service;

  constructor() {
    super();
    this.#service = new bookmarklistService();
  }

  findAll = this.wrapper(async (req, res) => {
    const data = await this.#service.findAll(req.query);
    return this.ok(res, data, "bookmarklists successfully retrieved");
  });

  findById = this.wrapper(async (req, res) => {
    const data = await this.#service.findById(req.params.id);
    if (!data) throw new NotFound("bookmarklist not found");

    return this.ok(res, data, "bookmarklist successfully retrieved");
  });

  create = this.wrapper(async (req, res) => {
    const data = await this.#service.create(req.body);
    return this.created(res, data, "bookmarklist successfully created");
  });

  update = this.wrapper(async (req, res) => {
    const data = await this.#service.update(req.params.id, req.body);
    return this.ok(res, data, "bookmarklist successfully updated");
  });

   addThread = this.wrapper(async (req, res) => {
    const userId = req.user.id;
    const data = await this.#service.addThread(userId, req.body);
    return this.created(res, data, "Thread added to bookmark folder");
  });

  removeThread = this.wrapper(async (req, res) => {
    const userId = req.user.id;
    const data = await this.#service.removeThread(userId, req.body);
    return this.ok(res, data, "Thread removed from bookmark folder");
  });

  getUserFolders = this.wrapper(async (req, res) => {
  const userId = req.user.id;

  const folders = await this.#service.getFoldersByUserId(userId);

  return this.ok(res, folders, "User folders fetched successfully");
});


  getThreadsInFolder = this.wrapper(async (req, res) => {
    const userId = req.user.id;
    const folderId = Number(req.params.folderId);

    const data = await this.#service.getThreadsInFolder(userId, folderId);
    return this.ok(res, data, "Folder threads retrieved");
  });

  delete = this.wrapper(async (req, res) => {
    const data = await this.#service.delete(req.params.id);
    return this.noContent(res, "bookmarklist successfully deleted");
  });
}

export default bookmarklistController;
