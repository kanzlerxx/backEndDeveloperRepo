import BaseService from "../../base/service.base.js";
import prisma from "../../config/prisma.db.js";
import { createClient } from "@supabase/supabase-js";
import { NotFound } from "../../exceptions/catch.execption.js";
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

  //    if (query.paginate) {
  //   const page = parseInt(query.page) || 1;
  //   q.take = 5;
  //   q.skip = (page - 1) * 5;  
  // }

  const data = await this.db.threads.findMany();
  // const countData = await this.db.threads.count({ where: q.where });
  // return this.paginate(data, countData, q);

  return data;

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
    const data = await this.db.threads.findUnique({ where: { id } });
    return data;
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

}

export default threadsService;  
