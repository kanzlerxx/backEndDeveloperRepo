import BaseService from "../../base/service.base.js";
import prisma from "../../config/prisma.db.js";
import { createClient } from "@supabase/supabase-js";
import { error } from "console";
import { Forbidden, NotFound, BadRequest } from '../../exceptions/catch.execption.js';

const checkIsLiked = (thread, userId) => {
  if (!userId) return false;  
  return thread.like_threads?.some(like => like.user_id === userId) || false;
};


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

class threadsService extends BaseService {
  constructor() {
    super(prisma);
  }

  

  async uploadImage(thumbnail, thread_id) {
    if (!thumbnail) return null;

    const uploadPath = `thumbnail/${thread_id}-${Date.now()}`;

    const { data, error } = await supabase.storage
      .from("image")
      .upload(uploadPath, thumbnail.buffer, {
        contentType: thumbnail.mimetype,
      });

    if (error) throw new Error("Upload failed: " + error.message);

    return supabase.storage
      .from("image")
      .getPublicUrl(uploadPath).data.publicUrl;
  }

  // Upload multiple images - max 5
// Upload multiple images - max 5
async uploadMultipleImages(threads_images, thread_id) {
  if (!threads_images || threads_images.length === 0) return [];

  if (threads_images.length > 5) {
    throw new BadRequest("Maksimal 5 gambar diperbolehkan");
  }

  const results = [];

  for (const thumbnail of threads_images) {
    const uploadPath = `threads_image/${thread_id}-${Date.now()}-${Math.random()}`;

    const { error: upErr } = await supabase.storage
      .from("image")
      .upload(uploadPath, thumbnail.buffer, {
        contentType: thumbnail.mimetype,
      });

    if (upErr) {
      console.error("Upload multiple error:", upErr);
      throw new Error("Upload failed: " + upErr.message);
    }

    const url = supabase.storage.from("image").getPublicUrl(uploadPath).data.publicUrl;

    // simpan ke DB — gunakan nama model dan kolom sesuai schema.prisma
    const saved = await this.db.threads_images.create({
      data: {
        threads_id: Number(thread_id),
        threads_images_url: url,
      },
    });

    results.push(saved);
  }

  return results;
}

async updateThreadImages(thread_id, existingUrls = [], newThreadsImages = []) {
  // Ambil gambar lama dari DB
  const oldImages = await this.db.threads_images.findMany({
    where: { threads_id: Number(thread_id) }
  });

  // 1️⃣ Hapus gambar yang tidak ada lagi di existingUrls
  for (const img of oldImages) {
    if (!existingUrls.includes(img.threads_images_url)) {
      await this.deleteOldImage(img.threads_images_url);
      await this.db.threads_images.delete({
        where: { id: img.id }
      });
    }
  }

  // 2️⃣ Upload gambar baru
  if (newThreadsImages && newThreadsImages.length > 0) {
   await this.uploadMultipleImages(newThreadsImages, Number(thread_id));
  }

  return await this.db.threads_images.findMany({
    where: { threads_id: Number(thread_id) }
  });
}



  async deleteOldImage(url) {
    if (!url) return { ok: true, message: "no url provided" };

    try {
      // 1) pastikan url berisi '/object/public/'
      const parts = url.split("/object/public/");
      if (parts.length < 2) {
        console.warn("deleteOldImage: unexpected url format:", url);
        return { ok: false, message: "unexpected url format" };
      }

      // hasil = "<bucket>/<path...>"
      const pathAfterPublic = parts[1]; // e.g. "image/thumbnail/123-12345"
      const [bucket, ...fileParts] = pathAfterPublic.split("/");
      const filePath = fileParts.join("/");

      if (!bucket || !filePath) {
        console.warn("deleteOldImage: cannot extract bucket/filePath from:", pathAfterPublic);
        return { ok: false, message: "cannot extract bucket/filePath" };
      }

      // Debug log
      console.info("deleteOldImage -> bucket:", bucket, "filePath:", filePath);

      // call supabase remove
      const { error } = await supabase.storage.from(bucket).remove([filePath]);

      if (error) {
        console.error("deleteOldImage supabase error:", error);
        return { ok: false, message: error.message || "supabase remove error", error };
      }

      return { ok: true, message: "deleted" };
    } catch (err) {
      console.error("deleteOldImage exception:", err);
      return { ok: false, message: err.message || "exception" };
    }
  }

  async deleteAllThreadImages(thread_id) {
    console.log("🔥 MASUK deleteAllThreadImages, thread_id =", thread_id);
  const threads_images = await this.db.threads_images.findMany({
    where: { threads_id: Number(thread_id) }
  });

  for (const img of threads_images) {
    await this.deleteOldImage(img.url); // Hapus dari Supabase
  }

  await this.db.threads_images.deleteMany({
    where: { threads_id: Number(thread_id) }
  });

  return true;
}


  // const countData = await this.db.threads.count({ where: q.where });
  // return this.paginate(data, countData, q);
findAll = async (query, userId) => {
  const q = this.transformBrowseQuery(query);

  delete q.take;
  delete q.skip;

  const data = await this.db.threads.findMany({
    ...q,
    include: {
      threads_images: true,

      // tetap perlu agar bisa hitung is_liked jika user login
      like_threads: true,

      _count: {
        select: {
          like_threads: true,
          comments: true,
        },
      },
    },
  });

  return data.map(item => {
    const { _count, like_threads, ...rest } = item;

    return {
      ...rest,
      total_likes_threads: _count.like_threads,
      total_comments_threads: _count.comments,

      // guest → false | logged in → sesuai cek
      is_liked: checkIsLiked(item, userId),
    };
  });
};

showAllLikeThreads = async (query) => {
  const q = this.transformBrowseQuery(query);

  const data = await this.db.like_threads.findMany({
    ...q,
    include: {
      users: {
        select: {
          id: true,
          username: true,
          email: true,
        }
      },
      threads: {
        select: {
          id: true,
          threads_title: true,
          threads_thumbnail: true
        }
      }
    }
  });

  if (query.paginate) {
    const countData = await this.db.like_threads.count({ where: q.where });
    return this.paginate(data, countData, q);
  }

  return data;
};






 findAllRandom = async (query, userId) => {
  const page = parseInt(query.page) || 1;
  const limit = 20;

  let data = await this.db.threads.findMany({
    include: {
      threads_images: true,
      like_threads: true, // <── tambahkan
      _count: {
        select: {
          like_threads: true,
          comments: true,
        },
      },
    },
  });

  // mapping + hapus _count + hitung is_liked
  data = data.map(item => {
    const { _count, like_threads, ...rest } = item;
    return {
      ...rest,
      total_likes_threads: _count.like_threads,
      total_comments_threads: _count.comments,
      is_liked: checkIsLiked(item, userId), // <── tambahkan
    };
  });

  // Shuffle
  data = data.sort(() => Math.random() - 0.5);

  const start = (page - 1) * limit;
  const paginated = data.slice(start, start + limit);

  return {
    data: paginated,
    total: data.length,
    page,
    totalPages: Math.ceil(data.length / limit),
  };
};



 findByUserId = async (user_id, query, loggedInUserId) => {
  const page = parseInt(query.page) || 1;

  const data = await this.db.threads.findMany({
    where: { user_id: Number(user_id) },
    include: {
      threads_images: true,
      like_threads: true, // <── tambahkan
      _count: {
        select: {
          like_threads: true,
          comments: true,
        },
      },
    },
  });

  const finalData = data.map(item => {
    const { _count, like_threads, ...rest } = item;
    return {
      ...rest,
      total_likes_threads: _count.like_threads,
      total_comments_threads: _count.comments,
      is_liked: checkIsLiked(item, loggedInUserId), // <── tambahkan
    };
  });

  const count = await this.db.threads.count({
    where: { user_id: Number(user_id) },
  });

  return {
    data: finalData,
    total: count,
    page,
    totalPages: Math.ceil(count),
  };
};



  findById = async (id, userId) => {
  const data = await this.db.threads.findUnique({
    where: { id: Number(id) },
    include: {
      threads_images: true,
      like_threads: true,
      comments: {
        include: { users: true },
      },
      _count: {
        select: {
          like_threads: true,
          comments: true,
        },
      },
    },
  });

  if (!data) return null;

  // SAMAKAN DENGAN findAll:
  const { _count, comments, like_threads, ...rest } = data;

  return {
    ...rest,
    total_likes_threads: _count.like_threads,
    total_comments_threads: _count.comments,
    is_liked: checkIsLiked(data, userId),

  };
};

findThreadsByForumId = async (forumId, userId) => {
  const threads = await this.db.threads.findMany({
    where: { forum_id: forumId },
    include: {
      threads_images: true,
      like_threads: true,
      comments: true,
      users: true,
      forum: true
    }
  });

  return threads.map(th => ({
    id: th.id,
    user_id: th.user_id,
    threads_title: th.threads_title,
    threads_thumbnail: th.threads_thumbnail,
    threads_description: th.threads_description,
    threads_concern: th.threads_concern,
    forum_id: th.forum_id,
    threads_images: th.threads_images,
    total_likes_threads: th.like_threads.length,
    total_comments_threads: th.comments.length,
    is_liked: th.like_threads.some(l => l.user_id === userId),

  }));
};

findThreadsFromFollowingForum = async (userId) => {
  const follows = await this.db.follow.findMany({
    where: { user_id: userId },
    select: { following_forum_id: true }
  });

  const forumIds = follows.map(f => f.following_forum_id);
  if (forumIds.length === 0) return [];

  const threads = await this.db.threads.findMany({
    where: { forum_id: { in: forumIds } },
    include: {
      threads_images: true,
      like_threads: true,
      comments: true,
      users: true,
      forum: true
    }
  });

  return threads.map(th => ({
    id: th.id,
    user_id: th.user_id,
    threads_title: th.threads_title,
    threads_thumbnail: th.threads_thumbnail,
    threads_description: th.threads_description,
    threads_concern: th.threads_concern,
    forum_id: th.forum_id,
    threads_images: th.threads_images,
    total_likes_threads: th.like_threads.length,
    total_comments_threads: th.comments.length,
    is_liked: th.like_threads.some(l => l.user_id === userId),
  }));
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

unlikeThread = async ({ thread_id, user_id }) => {
  // 1. Cek apakah thread ada
  const thread = await this.db.threads.findUnique({
    where: { id: thread_id },
  });

  if (!thread) throw new NotFound("Thread not found");

  // 2. Cek apakah LIKE sudah ada
  const existing = await this.db.like_threads.findUnique({
    where: {
      user_id_threads_id: {
        user_id,
        threads_id: thread_id,
      },
    },
  });

  if (!existing) {
    throw new BadRequest("You have not liked this thread");
  }

  // 3. Hapus like (UNLIKE)
  await this.db.like_threads.delete({
    where: {
      user_id_threads_id: {
        user_id,
        threads_id: thread_id,
      },
    },
  });

  return { message: "Thread unliked successfully" };
};




  create = async (payload, thumbnail, threads_images, user_id) => {
  const { threads_title, threads_description } = payload;

  if (!threads_images || threads_images.length === 0) {
  threads_images = [];
}


  if (payload.threads_thumbnail === "" || payload.threads_thumbnail === undefined) {
  payload.threads_thumbnail = null;
}

 if (payload.threads_images === "" || payload.threads_images === undefined) {
  delete payload.threads_images;
}


  if (!threads_title) throw new BadRequest("Title is required");
  if (!threads_description) throw new BadRequest("Description is required");
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

  // Upload multiple images
  if (threads_images && threads_images.length > 0) {
    await this.uploadMultipleImages(threads_images, thread.id);
  }

  // Upload thumbnail
  if (thumbnail) {
    const url = await this.uploadImage(thumbnail, thread.id);
    await this.db.threads.update({
      where: { id: thread.id },
      data: { threads_thumbnail: url },
    });
    thread.threads_thumbnail = url;
  }

    // Ambil semua images setelah create
  const threads_images_create = await this.db.threads_images.findMany({
    where: { threads_id: thread.id },
  });

  return {
    ...thread,
    threads_images_create,
  };
};
 


  createThreadsInForum = async (user_id, forum_id, payload, thumbnail, threads_images) => {
    if (!threads_images || threads_images.length === 0) {
  threads_images = [];
}

  const isFollow = await this.db.follow.findFirst({
    where: {
      user_id: Number(user_id),
      following_forum_id: Number(forum_id),
    },
  });

  

  if (!isFollow) throw new Forbidden("User must follow the forum before posting.");

  const thread = await this.db.threads.create({
    data: {
      ...payload,
      forum_id: Number(forum_id),
      user_id: Number(user_id),
    },
  });

  // Upload multiple images
  if (threads_images && threads_images.length > 0) {
    await this.uploadMultipleImages(threads_images, thread.id);
  }

  // Upload thumbnail
  if (thumbnail) {
    const url = await this.uploadImage(thumbnail, thread.id);
    await this.db.threads.update({
      where: { id: thread.id },
      data: { threads_thumbnail: url },
    });
    thread.threads_thumbnail = url;
  }

  const threads_images_create = await this.db.threads_images.findMany({
    where: { threads_id: thread.id },
  });

  // Return lengkap
  return {
    ...thread,
    threads_images_create,
  };
};

 update = async (id, payload, thumbnail, threads_images) => {
  
  const thread = await this.db.threads.findUnique({
    where: { id: Number(id) },
  });

  if (!thread) throw new NotFound("Thread not found");

  const title = payload.threads_title?.trim() ?? "";
  const desc = payload.threads_description?.trim() ?? "";
  const concernRaw = payload.threads_concern;
  const concernClean =
    concernRaw === undefined ||
    concernRaw === null ||
    (typeof concernRaw === "string" && concernRaw.trim() === "")
      ? null
      : concernRaw.trim();

  const deleteImageFlag =
    payload.deleteImage === true || payload.deleteImage === "true";

  // Validation
  // Tidak usah validasi wajib dua duanya
const data = {};
if (payload.threads_title !== undefined) data.threads_title = title;
if (payload.threads_description !== undefined) data.threads_description = desc;
data.threads_concern = concernClean;


  // =============== THUMBNAIL HANDLING ===============
  if (deleteImageFlag && !thumbnail) {
    if (thread.threads_thumbnail) {
      await this.deleteOldImage(thread.threads_thumbnail);
    }
    data.threads_thumbnail = null;
  } else if (thumbnail) {
    if (thread.threads_thumbnail) {
      await this.deleteOldImage(thread.threads_thumbnail);
    }
    const newThumb = await this.uploadImage(thumbnail, id);
    data.threads_thumbnail = newThumb;
  }

  // =============== MULTIPLE IMAGES UPDATE ===============
  let existingImages = [];
  if (payload.existingImages) {
    try {
      existingImages = JSON.parse(payload.existingImages);
    } catch {}
  }

 const newImages = threads_images?.threads_images || [];

await this.updateThreadImages(id, existingImages, newImages);



  // =============== UPDATE THREAD RECORD ===============
  const updated = await this.db.threads.update({
    where: { id: Number(id) },
    data,
  });

  // Ambil images final
  const finalImages = await this.db.threads_images.findMany({
    where: { threads_id: Number(id) },
  });

  return {
    ...updated,
    threads_images: finalImages,
  };
};


  // ---------------- delete ----------------
 delete = async (id) => {
  const threadId = Number(id);

  // 1. Ambil SEMUA gambar sebelum DB dihapus
  const images = await this.db.threads_images.findMany({
    where: { threads_id: threadId }
  });

  console.log("📷 Jumlah thread images ditemukan:", threads_images.length);

  // 2. Hapus semua gambar dari Supabase
  for (const img of threads_images) {
    if (img.threads_images_url) {
      await this.deleteOldImage(img.threads_images_url);
    }
  }

  // 3. Hapus thumbnail jika ada
  const thread = await this.db.threads.findUnique({ where: { id: threadId } });
  if (thread?.threads_thumbnail) {
    await this.deleteOldImage(thread.threads_thumbnail);
  }

  // 4. Baru hapus DB images
  await this.db.threads_images.deleteMany({
    where: { threads_id: threadId }
  });

  // 5. Baru delete thread (di akhir)
  await this.db.threads.delete({
    where: { id: threadId }
  });

  return { message: "Thread deleted successfully" };
};



}

export default threadsService;  
