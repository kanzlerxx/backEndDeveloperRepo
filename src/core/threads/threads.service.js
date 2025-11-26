import BaseService from "../../base/service.base.js";
import prisma from "../../config/prisma.db.js";
import { createClient } from "@supabase/supabase-js";
import { NotFound,BadRequest } from "../../exceptions/catch.execption.js";
import { error } from "console";
import { Forbidden } from "../../exceptions/catch.execption.js";


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

class threadsService extends BaseService {
  constructor() {
    super(prisma);
  }

  async uploadImage(file, thread_id) {
    if (!file) return null;

    const uploadPath = `thumbnail/${thread_id}-${Date.now()}`;

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

  async deleteOldImage(url) {
    if (!url) return;

    const relativePath = url.replace(
      `${process.env.SUPABASE_URL}/storage/v1/object/public/image/`,
      ""
    );

    // hanya hapus jika foldernya "threads/"
    if (relativePath.startsWith("thumbnail/")) {
      await supabase.storage.from("image").remove([relativePath]);
    }
  }

 findAll = async (query) => {
  const q = this.transformBrowseQuery(query);

  delete q.take;
  delete q.skip;

  return await prisma.threads.findMany({
    ...q,
    select: {
      id: true,
      user_id: true,
      threads_title: true,
      threads_thumbnail: true,
      threads_description: true,
      threads_concern: true,
      forum_id: true,
    }
  });
};


  findAllRandom = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = 5;

    // Ambil semua data dulu
    let data = await this.db.threads.findMany();

    // Randomize data
    data = data.sort(() => Math.random() - 0.5);

    // Paginate
    const start = (page - 1) * limit;
    const paginated = data.slice(start, start + limit);

    return {
      data: paginated,
      total: data.length,
      page,
      totalPages: Math.ceil(data.length / limit),
    };
  };

  findByUserId = async (user_id, query) => {
    const page = parseInt(query.page) || 1;
    

    const data = await this.db.threads.findMany({
      where: { user_id: Number(user_id) },
    });

    const count = await this.db.threads.count({
      where: { user_id: Number(user_id) },
    });

    return {
      data,
      total: count,
      page,
      totalPages: Math.ceil(count),
    };
  };

  findById = async (id) => {
    const data = await this.db.threads.findUnique({
  where: { id: Number(id) }
});
    return data;
  };

likeThread = async ({ thread_id, user_id }) => {
  const thread = await this.db.threads.findUnique({
    where: { id: thread_id }
  });

  if (!thread) throw new NotFound("Thread not found");

  // cek apa user sudah like
  const existingLike = await this.db.like_threads.findUnique({
    where: {
      user_id_threads_id: {
        user_id,
        threads_id: thread_id
      }
    }
  });

  if (existingLike) {
    throw new BadRequest("You have already liked this thread");
  }

  // create like
  const newLike = await this.db.like_threads.create({
    data: {
      user_id,
      threads_id: thread_id
    }
  });

  return newLike;
};



  create = async (payload, file, user_id) => {
  if (!user_id) {
    throw new Error("user_id tidak boleh undefined");
  }

  const thread = await this.db.threads.create({
    data: {
      ...payload,
      forum_id: null,
      user_id: user_id,
    },
  });

  if (file) {
    const url = await this.uploadImage(file, thread.id);

    await this.db.threads.update({
      where: { id: thread.id },
      data: { threads_thumbnail: url },
    });

    thread.threads_thumbnail = url;
  }

  return thread;
};



  createThreadsInForum = async (user_id, forum_id, payload, file) => {
    // cek apakah user follow forum tersebut
    const isFollow = await this.db.follow.findFirst({
      where: {
        user_id: Number(user_id),
        following_forum_id: Number(forum_id),
      },
    });

    if (!isFollow) {
      throw new forbidden("User must follow the forum before posting.");
    }

    const thread = await this.db.threads.create({
      data: {
        ...payload,
        forum_id: Number(forum_id),
        user_id: Number(user_id),
      },
    });

    if (file) {
      const url = await this.uploadImage(file, thread.id);
      await this.db.threads.update({
        where: { id: thread.id },
        data: { threads_thumbnail: url },
      });
      thread.threads_thumbnail = url;
    }

    return thread;
  };

  update = async (id, payload, file) => {
  const thread = await this.db.threads.findUnique({
    where: { id: Number(id) },
  });

  if (!thread) throw new NotFound("Thread not found");

  // Build data update ONLY from non-empty fields
  const data = {};

  if (payload.threads_title && payload.threads_title.trim() !== "") {
    data.threads_title = payload.threads_title;
  }

  if (payload.threads_concern && payload.threads_concern.trim() !== "") {
    data.threads_concern = payload.threads_concern;
  }

  if (
    payload.threads_description &&
    payload.threads_description.trim() !== ""
  ) {
    data.threads_description = payload.threads_description;
  }

  // If no file sent → just update text fields
  if (!file) {
    const updated = await this.db.threads.update({
      where: { id: Number(id) },
      data,
    });
    return updated;
  }

  // If file exists → delete old image
  if (thread.threads_thumbnail) {
    await this.deleteOldImage(thread.threads_thumbnail);
  }

  // Upload new image
  const url = await this.uploadImage(file, id);

  const updatedWithImage = await this.db.threads.update({
    where: { id: Number(id) },
    data: {
      ...data,
      threads_thumbnail: url,
    },
  });

  return updatedWithImage;
};



  delete = async (id) => {
  const thread = await this.db.threads.findUnique({
    where: { id: Number(id) }, // ← FIX
  });

  if (!thread) throw new NotFound("Thread not found");

  // Hapus foto jika ada
  if (thread.thumbnail) {
    await this.deleteOldImage(thread.thumbnail);
  }

  await this.db.threads.delete({
    where: { id: Number(id) }, // ← FIX
  });

  return { message: "Thread deleted" };
};

deleteAllByUser = async (user_id) => {
  user_id = Number(user_id);

  if (!user_id) throw new BadRequest("Invalid user_id");

  // 1. Ambil semua thread milik user
  const threads = await this.db.threads.findMany({
    where: { user_id }
  });

  // Jika tidak ada thread → optional: lempar error atau return
  if (!threads.length) {
    return { message: "User has no threads to delete", count: 0 };
  }

  // 2. Hapus semua thumbnail yang ada
  for (const thread of threads) {
    if (thread.threads_thumbnail) {
      await this.deleteOldImage(thread.threads_thumbnail);
    }
  }

  // 3. Hapus semua threads milik user
  await this.db.threads.deleteMany({
    where: { user_id }
  });

  return {
    message: "All user threads deleted successfully",
    count: threads.length
  };
};


}

export default threadsService;  
