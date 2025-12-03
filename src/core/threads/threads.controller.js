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
      const userId = req.user?.id || null;
      const data = await this.#service.findAll(req.query, userId);
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

likeThread = this.wrapper(async (req, res) => {

  const { thread_id } = req.body;

  if (!thread_id) {
    throw new BadRequest("thread_id is required");
  }

  const user_id = req.user?.id;
  if (!user_id) throw new Forbidden("Unauthorized");

  const data = await this.#service.likeThread({
    thread_id: Number(thread_id),
    user_id: Number(user_id)
  });

  return this.ok(res, data, "threads liked successfully");
});

unlikeThread = this.wrapper(async (req, res) => {

  const { thread_id } = req.body;

  if (!thread_id) {
    throw new BadRequest("thread_id is required");
  }

  const user_id = req.user?.id;
  if (!user_id) throw new Forbidden("Unauthorized");

  const data = await this.#service.unlikeThread({
    thread_id: Number(thread_id),
    user_id: Number(user_id)
  });

  return this.ok(res, data, "thread unliked successfully");
});



    create = this.wrapper(async (req, res) => {
  const thumbnail = req.files?.threads_thumbnail?.[0] || null;
  const threads_images = req.files?.threads_images || [];
  const user_id = req.user.id;

  const data = await this.#service.create(req.body, thumbnail, threads_images, user_id);

  return this.created(res, data, "Thread created");
});



    createThreadsInForum = this.wrapper(async (req, res) => {
  const threads_thumbnail = req.files?.threads_thumbnail?.[0] || null;
  const threads_images = req.files?.threads_images || [];
  const userId = req.user.id;
  const { forum_id } = req.params;

  const data = await this.#service.createThreadsInForum(
    userId,
    forum_id,
    req.body,
    threads_thumbnail,
    threads_images
  );

  return this.created(res, data, "Thread created in forum");
});


  update = this.wrapper(async (req, res) => {
  const threads_thumbnail = req.files?.threads_thumbnail?.[0] || null;       // thumbnail baru
  const threads_images = req.files?.threads_images || [];          // gambar baru (array)

  const data = await this.#service.update(
    req.params.id,
    req.body,
    threads_thumbnail,
    { threads_images }                                      // ✔ KIRIM FORMAT YANG BENAR
  );

  return this.ok(res, data, "Thread updated");
});


  delete = this.wrapper(async (req, res) => {
    await this.#service.delete(req.params.id);
    return this.noContent(res, "Thread deleted");
  });

  deleteMyThreads = this.wrapper(async (req, res) => {
  const user_id = req.user.id;

  const result = await this.#service.deleteAllByUser(user_id);

  return this.ok(res, result, "All your threads deleted");
});

  }

  export default threadsController;
