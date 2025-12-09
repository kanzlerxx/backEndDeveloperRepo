import BaseService from "../../base/service.base.js";
import prisma from "../../config/prisma.db.js";
import { createClient } from "@supabase/supabase-js";
import { NotFound,BadRequest } from "../../exceptions/catch.execption.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const checkIsFollowed = (forum, userId) => {
  if (!userId) return false;
  return forum.follow?.some(f => f.user_id === userId) || false;
};



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


findAll = async (query, userId) => {
  const forums = await this.db.forum.findMany({
    orderBy: { id: "asc" },
    include: {
      follow: true,
      categories: { // Relasi ke categories
        select: {
          id: true,
          categories_name: true // sesuai dengan field di model
        }
      },
      _count: {
        select: {
          threads: true,
          follow: true
        }
      }
    }
  });

  return forums.map(forum => ({
    id: forum.id,
    user_id: forum.user_id,
    forum_title: forum.forum_title,
    forum_description: forum.forum_description,
    forum_profile: forum.forum_profile,
    forum_banner: forum.forum_banner,
    id_categories: forum.id_categories,
    
    // TAMBAHKAN DATA CATEGORIES
    category_name: forum.categories?.categories_name || null,
    // atau jika ingin objek lengkap:
    // category: forum.categories ? {
    //   id: forum.categories.id,
    //   name: forum.categories.categories_name
    // } : null,

    forum_total_threads: forum._count.threads,
    forum_total_follower: forum._count.follow,

    // CEK FOLLOW DENGAN USERID
    is_followed: forum.follow.some(f => f.user_id === userId)
  }));
};


findById = async (id, userId) => {
  const forum = await this.db.forum.findUnique({
    where: { id: Number(id) },
    include: {
      follow: true,
      categories: { // Tambahkan include categories
        select: {
          id: true,
          categories_name: true
        }
      },
      _count: {
        select: {
          threads: true,
          follow: true
        }
      }
    }
  });

  if (!forum) return null;

  return {
    id: forum.id,
    user_id: forum.user_id,
    forum_title: forum.forum_title,
    forum_description: forum.forum_description,
    forum_profile: forum.forum_profile,
    forum_banner: forum.forum_banner,
    id_categories: forum.id_categories,
    category_name: forum.categories?.categories_name || null, // Tambahkan
    
    forum_total_threads: forum._count.threads,
    forum_total_follower: forum._count.follow,

    // CEK FOLLOW DENGAN USERID
    is_followed: forum.follow.some(f => f.user_id === userId)
  };
};

findForumsByTotalFollower = async (userId) => {
  const forums = await this.db.forum.findMany({
    orderBy: { forum_total_follower: "desc" },
    include: {
      follow: true,
      categories: { // Tambahkan include categories
        select: {
          id: true,
          categories_name: true
        }
      },
      _count: {
        select: { 
          threads: true, 
          follow: true 
        }
      }
    }
  });

  return forums.map(forum => ({
    id: forum.id,
    user_id: forum.user_id,
    forum_title: forum.forum_title,
    forum_description: forum.forum_description,
    forum_profile: forum.forum_profile,
    forum_banner: forum.forum_banner,
    id_categories: forum.id_categories,
    category_name: forum.categories?.categories_name || null, // Tambahkan
    
    forum_total_threads: forum._count.threads,
    forum_total_follower: forum._count.follow,

    // CEK FOLLOW DENGAN USERID
    is_followed: forum.follow.some(f => f.user_id === userId)
  }));
};








  create = async (payload, profileFile, bannerFile) => {
  // Step 1: Create forum without images
  payload.id_categories = Number(payload.id_categories);
  
  // Buat forum dengan include categories
  const forum = await this.db.forum.create({
    data: payload,
    include: {
      categories: { // Include categories untuk response
        select: {
          id: true,
          categories_name: true
        }
      }
    }
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

  return {
    ...forum,
    category_name: forum.categories?.categories_name || null, // Tambahkan
    is_follow: false
  };
};

update = async (id, payload, profileFile, bannerFile, userId) => {
  payload.id_categories = Number(payload.id_categories);
  const forum = await this.db.forum.findUnique({
    where: { id: Number(id) },
    include: {
      categories: { // Include categories untuk mendapatkan data lama
        select: {
          id: true,
          categories_name: true
        }
      }
    }
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
    include: {
      categories: { // Include categories untuk response update
        select: {
          id: true,
          categories_name: true
        }
      }
    }
  });

  return {
    ...updated,
    category_name: updated.categories?.categories_name || null, // Tambahkan
    is_follow: await this.db.follow.findFirst({
      where: {
        user_id: userId,
        following_forum_id: updated.id
      }
    }) ? true : false
  };
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
