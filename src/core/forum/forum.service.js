import BaseService from "../../base/service.base.js";
import prisma from '../../config/prisma.db.js';

class forumService extends BaseService {
  constructor() {
    super(prisma);
  }

  findAll = async (query) => {
    const q = this.transformBrowseQuery(query);
    const forums = await this.db.forum.findMany({
      ...q,
      include: {
        _count: {
          select: {
            threads: true,
            follow: true,
          },
        },
      },
    });

    const data = forums.map((forum) => {
      const { _count, ...rest } = forum;
      return {
        ...rest,
        forum_total_threads: _count.threads,
        forum_total_follower: _count.follow,
      };
    });

    if (query.paginate) {
      const countData = await this.db.forum.count({ where: q.where });
      return this.paginate(data, countData, q);
    }
    return data;
  };

  findById = async (id) => {
    const data = await this.db.forum.findUnique({   where: { id: Number(id)} });
    return data;
  };

  create = async (payload) => {
    const data = await this.db.forum.create({ data: payload });
    return data;
  };

  update = async (id, payload) => {
    const data = await this.db.forum.update({ where: { id }, data: payload });
    return data;
  };

  followForum = async ({ forum_id, user_id }) => {
  // 1. Cek apakah forum ada
  const forum = await this.db.forum.findUnique({
    where: { id: forum_id },
  });

  if (!forum) throw new NotFound("Forum not found");

  // 2. Cek apakah user sudah follow
  const existingFollow = await this.db.follow.findUnique({
    where: {
      user_id_following_forum_id: {
        user_id,
        following_forum_id: forum_id,
      },
    },
  });

  if (existingFollow) {
    throw new BadRequest("You have already followed this forum");
  }

  // 3. Insert follow
  await this.db.follow.create({
    data: {
      user_id,
      following_forum_id: forum_id,
    },
  });

  // 4. Update total follower
  await this.db.forum.update({
    where: { id: forum_id },
    data: {
      forum_total_follower: {
        increment: 1,
      },
    },
  });

  return { message: "Forum followed successfully" };
};

unfollowForum = async ({ forum_id, user_id }) => {
  // cek forum
  const forum = await this.db.forum.findUnique({
    where: { id: forum_id },
  });

  if (!forum) throw new NotFound("Forum not found");

  // cek follow exist
  const existingFollow = await this.db.follow.findUnique({
    where: {
      user_id_following_forum_id: {
        user_id,
        following_forum_id: forum_id,
      },
    },
  });

  if (!existingFollow) {
    throw new BadRequest("You have not followed this forum");
  }

  // hapus follow
  await this.db.follow.delete({
    where: {
      user_id_following_forum_id: {
        user_id,
        following_forum_id: forum_id,
      },
    },
  });

  // decrement followers
  await this.db.forum.update({
    where: { id: forum_id },
    data: {
      forum_total_follower: {
        decrement: 1,
      },
    },
  });

  return { message: "Forum unfollowed successfully" };
};


  delete = async (id) => {
    const data = await this.db.forum.delete({ where: { id } });
    return data;
  };
}

export default forumService;  
