  import BaseController from "../../base/controller.base.js";
  import { NotFound } from "../../exceptions/catch.execption.js";
  import threadsService from "./threads.service.js";

  class threadsController extends BaseController {
    #service;

    constructor() {
      super();
      this.#service = new threadsService();
    }

    findAll = this.wrapper(async (req, res) => {
      const data = await this.#service.findAll(req.query);
      return this.ok(res, data, "threadss successfully retrieved");
    });

    findAllRandom = this.wrapper(async (req, res) => {
      const data = await this.#service.findAllRandom(req.query);
      return this.ok(res, data, "random threads successfully retrieved");
    });

    findByUserId = this.wrapper(async (req, res) => {
      const data = await this.#service.findByUserId(req.params.user_id, req.query);
      return this.ok(res, data, "threads by user successfully retrieved");
    });

    findById = this.wrapper(async (req, res) => {
      const data = await this.#service.findById(req.params.id);
      if (!data) throw new NotFound("threads not found");

      return this.ok(res, data, "threads successfully retrieved");
    });

    create = this.wrapper(async (req, res) => {
  const file = req.files?.image?.[0] || null;
  const files = req.files?.images || [];
  const user_id = req.user.id;

  const data = await this.#service.create(req.body, file, files, user_id);

  return this.created(res, data, "Thread created");
});



    createThreadsInForum = this.wrapper(async (req, res) => {
  const file = req.files?.image?.[0] || null;
  const files = req.files?.images || [];
  const userId = req.user.id;
  const { forum_id } = req.params;

  const data = await this.#service.createThreadsInForum(
    userId,
    forum_id,
    req.body,
    file,
    files
  );

  return this.created(res, data, "Thread created in forum");
});


  update = this.wrapper(async (req, res) => {
    const file = req.files?.image?.[0] || null;
    const files = req.files || {};
    const data = await this.#service.update(req.params.id, req.body, file, files);

    return this.ok(res, data, "Thread updated");
  });

  delete = this.wrapper(async (req, res) => {
    await this.#service.delete(req.params.id);
    return this.noContent(res, "Thread deleted");
  });
  }

  export default threadsController;
