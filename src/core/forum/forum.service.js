import BaseService from "../../base/service.base.js";
import prisma from "../../config/prisma.db.js";
import { createClient } from "@supabase/supabase-js";
import { NotFound } from "../../exceptions/catch.execption.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

class forumService extends BaseService {
  constructor() {
    super(prisma);
  }

  // -------------------- UPLOAD IMAGE --------------------
  async uploadImage(file, folder, forum_id) {
    if (!file) return null;

    const uploadPath = `${folder}/${forum_id}-${Date.now()}`;

    const { data, error } = await supabase.storage
      .from("image")
      .upload(uploadPath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw new Error("Upload failed: " + error.message);

    return supabase.storage
      .from("image")
      .getPublicUrl(uploadPath).data.publicUrl;
  }

  // -------------------- DELETE OLD IMAGE --------------------
  async deleteOldImage(url, folder) {
    if (!url) return;

    const base = `${process.env.SUPABASE_URL}/storage/v1/object/public/image/`;

    const rel = url.replace(base, "");

    // hanya hapus jika folder sesuai
    if (rel.startsWith(`${folder}/`)) {
      await supabase.storage.from("image").remove([rel]);
    }
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

  create = async (payload, profileFile, bannerFile) => {
  if (!forum_title) throw new BadRequest("Forum Title is required");
  if (!forum_description) throw new BadRequest("Description is required");
  if (!id_categories) throw new BadRequest("Categories is required");
    // Step 1: Create forum without images
    payload.id_categories = Number(payload.id_categories);
    const forum = await this.db.forum.create({
      data: payload,
    });

    let profileUrl = null;
    let bannerUrl = null;

    // Step 2: Upload profile image
    if (profileFile) {
      profileUrl = await this.uploadImage(profileFile, "forum_profile", forum.id);
    }

    // Step 3: Upload banner image
    if (bannerFile) {
      bannerUrl = await this.uploadImage(bannerFile, "forum_banner", forum.id);
    }

    // Step 4: Update forum with image URLs
    if (profileUrl || bannerUrl) {
      await this.db.forum.update({
        where: { id: forum.id },
        data: {
          forum_profile: profileUrl,
          forum_banner: bannerUrl,
        },
      });

      forum.forum_profile = profileUrl;
      forum.forum_banner = bannerUrl;
    }

    return forum;
  };

  update = async (id, payload, profileFile, bannerFile) => {
    payload.id_categories = Number(payload.id_categories);
    const forum = await this.db.forum.findUnique({
      where: { id: Number(id) },
    });

    if (!forum) throw new NotFound("Forum not found");

    // UPDATE TEXT DATA FIRST
    const updatedData = {};
    for (const key of Object.keys(payload)) {
      if (payload[key] !== undefined && payload[key] !== "") {
        updatedData[key] = payload[key];
      }
    }

    // Prepare image URL containers
    let profileUrl = null;
    let bannerUrl = null;

    // UPDATE PROFILE PHOTO
    if (profileFile) {
      if (forum.forum_profile) {
        await this.deleteOldImage(forum.forum_profile, "forum_profile");
      }

      profileUrl = await this.uploadImage(profileFile, "forum_profile", id);
      updatedData.forum_profile = profileUrl;
    }

    // UPDATE BANNER
    if (bannerFile) {
      if (forum.forum_banner) {
        await this.deleteOldImage(forum.forum_banner, "forum_banner");
      }

      bannerUrl = await this.uploadImage(bannerFile, "forum_banner", id);
      updatedData.forum_banner = bannerUrl;
    }

    const updated = await this.db.forum.update({
      where: { id: Number(id) },
      data: updatedData,
    });

    return updated;
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
    const forum = await this.db.forum.findUnique({
      where: { id: Number(id) },
    });

    if (!forum) throw new NotFound("Forum not found");

    // Hapus profile & banner
    if (forum.forum_profile) {
      await this.deleteOldImage(forum.forum_profile, "forum_profile");
    }

    if (forum.forum_banner) {
      await this.deleteOldImage(forum.forum_banner, "forum_banner");
    }

    await this.db.forum.delete({
      where: { id: Number(id) },
    });

    return { message: "Forum deleted" };
  };
}

export default forumService;  
