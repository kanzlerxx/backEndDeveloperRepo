import BaseController from "../../base/controller.base.js";
import { NotFound } from "../../exceptions/catch.execption.js";
import forumService from "./forum.service.js";

class forumController extends BaseController {
  #service;

  constructor() {
    super();
    this.#service = new forumService();
  }

  findAll = this.wrapper(async (req, res) => {
    const userId = req.user?.id;
const data = await this.#service.findAll(req.query, userId);


const sanitizedItems = data.map(item => {
  const { follow, ...rest } = item;
  return rest;
});

return this.ok(res, sanitizedItems);
  });


  findById = this.wrapper(async (req, res) => {

  const userId = req.user?.id;
const data = await this.#service.findById(req.params.id, userId);


  if (!data) throw new NotFound("forum not found");

  return this.ok(res, data, "forum successfully retrieved");
});

findForumsByTotalFollower = this.wrapper(async (req, res) => {
  const userId = req.user?.id;
  const data = await this.#service.findForumsByTotalFollower(userId);

  return this.ok(res, data, "forum sorted by total follower");
});


  followForum = this.wrapper(async (req, res) => {
  const { forum_id } = req.body;

  if (!forum_id) throw new BadRequest("forum_id is required");

  const user_id = req.user.id;

  const data = await this.#service.followForum({
    forum_id: Number(forum_id),
    user_id: Number(user_id),
  });

  return this.ok(res, data);
});




unfollowForum = this.wrapper(async (req, res) => {
  const { forum_id } = req.body;

  if (!forum_id) throw new BadRequest("forum_id is required");

  const user_id = req.user.id;

  const data = await this.#service.unfollowForum({
    forum_id: Number(forum_id),
    user_id: Number(user_id),
  });

  return this.ok(res, data);
});


  create = this.wrapper(async (req, res) => {
  const user = req.user; // hasil dari middleware auth()

  if (!user) {
    return this.unauthorized(res, "User tidak terautentikasi");
  }

  const { forum_profile, forum_banner } = req.files;

  const data = await this.#service.create(
    {
      ...req.body,
      user_id: user.id, // ⬅⬅ tambahkan ini!
    },
    forum_profile?.[0],
    forum_banner?.[0]
  );

  return this.created(res, data, "forum successfully created");
});


update = this.wrapper(async (req, res) => {
  const userId = req.user.id;

  const data = await this.#service.update(
    req.params.id,
    req.body,
    req.files?.forum_profile?.[0],
    req.files?.forum_banner?.[0],
    userId
  );

  return this.ok(res, data, "forum successfully updated");
});

  


  delete = this.wrapper(async (req, res) => {
    const data = await this.#service.delete(req.params.id);
    return this.noContent(res, "forum successfully deleted");
  });
}

export default forumController;
