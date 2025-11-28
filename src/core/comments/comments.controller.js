import BaseController from "../../base/controller.base.js";
import { NotFound,BadRequest } from "../../exceptions/catch.execption.js";
import commentsService from "./comments.service.js";


class commentsController extends BaseController {
  #service;

  constructor() {
    super();
    this.#service = new commentsService();
  }

  findAll = this.wrapper(async (req, res) => {
    const data = await this.#service.findAll(req.query);
    return this.ok(res, data, "commentss successfully retrieved");
  });

  findById = this.wrapper(async (req, res) => {
    const data = await this.#service.findById(req.params.id);
    if (!data) throw new NotFound("comments not found");

    return this.ok(res, data, "comments successfully retrieved");
  });

createComment = this.wrapper(async (req, res) => {
  const user_id = req.user.id;
  const data = await this.#service.createComment(req.body, req.file, user_id);
  return this.ok(res, data, "Comment created successfully");
});

likeComment = this.wrapper(async (req, res) => {
  const { comment_id } = req.body;

  if (!comment_id) throw new BadRequest("comment_id is required");

  const user_id = req.user.id;

  const data = await this.#service.likeComment({
    comment_id: Number(comment_id),
    user_id: Number(user_id)
  });

  return this.ok(res, data);
});

unlikeComment = this.wrapper(async (req, res) => {
  const { comment_id } = req.body;

  if (!comment_id) throw new BadRequest("comment_id is required");

  const user_id = req.user.id;

  const data = await this.#service.unlikeComment({
    comment_id: Number(comment_id),
    user_id: Number(user_id)
  });

  return this.ok(res, data);
});



  update = this.wrapper(async (req, res) => {
    const data = await this.#service.update(req.params.id, req.body);
    return this.ok(res, data, "comments successfully updated");
  });

  delete = this.wrapper(async (req, res) => {
    const data = await this.#service.delete(req.params.id);
    return this.noContent(res, "comments successfully deleted");
  });
}

export default commentsController;
