import BaseService from "../../base/service.base.js";
import prisma from '../../config/prisma.db.js';
import { createClient } from "@supabase/supabase-js";
import { NotFound,BadRequest } from "../../exceptions/catch.execption.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

class commentsService extends BaseService {
  constructor() {
    super(prisma);
  }

findAll = async (query) => {
  const q = this.transformBrowseQuery(query);

  const data = await this.db.comments.findMany({
    ...q,
    include: {
      _count: {
        select: { like_comments: true }
      }
    }
  });

  // Tambahkan total_like sebagai field baru
  const formatted = data.map((c) => ({
    ...c,
    total_like: c._count.like_comments
  }));

  if (query.paginate) {
    const countData = await this.db.comments.count({ where: q.where });
    return this.paginate(formatted, countData, q);
  }

  return formatted;
};

findById = async (id) => {
  const data = await this.db.comments.findUnique({
    where: { id },
    include: {
      _count: {
        select: { like_comments: true }
      }
    }
  });

  if (!data) return null;

  return {
    ...data,
    total_like: data._count.like_comments
  };
};

createComment = async (payload, file, user_id) => {
  const { comment_desc, threads_id, bind_to_comment } = payload;

  if (!user_id) throw new BadRequest("Unauthorized");
  if (!comment_desc) throw new BadRequest("comment_desc is required");
  if (!threads_id) throw new BadRequest("threads_id is required");

  // Jika ini reply → pastikan comment yang direply ada
  let parentComment = null;
  if (bind_to_comment) {
    parentComment = await this.db.comments.findUnique({
      where: { id: Number(bind_to_comment) }
    });

    if (!parentComment) throw new NotFound("Parent comment not found");

    // optional — cegah reply ke comment lain thread
    if (parentComment.threads_id !== Number(threads_id)) {
      throw new BadRequest("Cannot reply to a comment from different thread");
    }
  }

  // Buat comment
  const comment = await this.db.comments.create({
    data: {
      user_id,
      comment_desc,
      threads_id: Number(threads_id),
      bind_to_comment: bind_to_comment ? Number(bind_to_comment) : null,
    },
    include: {
      _count: { select: { like_comments: true } }
    }
  });

  let finalResult = {
    ...comment,
    total_like: comment._count.like_comments,
  };

  // Kalau tidak ada file → return
  if (!file) return finalResult;

  // Upload file
  const uploadPath = `comments/${comment.id}-${Date.now()}`;

  const { error } = await supabase.storage
    .from("image")
    .upload(uploadPath, file.buffer, { contentType: file.mimetype });

  if (error) throw new Error("Upload failed: " + error.message);

  const publicUrl = supabase.storage
    .from("image")
    .getPublicUrl(uploadPath).data.publicUrl;

  const updatedComment = await this.db.comments.update({
    where: { id: comment.id },
    data: { uploaded_file: publicUrl },
    include: {
      _count: { select: { like_comments: true } }
    }
  });

  return {
    ...updatedComment,
    total_like: updatedComment._count.like_comments
  };
};



likeComment = async ({ comment_id, user_id }) => {
  // 1. Pastikan comment ada
  const comment = await this.db.comments.findUnique({
    where: { id: comment_id }
  });

  if (!comment) throw new NotFound("Comment not found");

  // 2. Cek apakah user sudah like
  const existing = await this.db.like_comments.findUnique({
    where: {
      user_id_comment_id: {
        user_id,
        comment_id
      }
    }
  });

  if (existing) {
    throw new BadRequest("You have already liked this comment");
  }

  // 3. Buat like baru
  const newLike = await this.db.like_comments.create({
    data: {
      user_id,
      comment_id
    }
  });

  return {
    message: "Comment liked successfully",
    data: newLike
  };
};

unlikeComment = async ({ comment_id, user_id }) => {
  // 1. Pastikan comment ada
  const comment = await this.db.comments.findUnique({
    where: { id: comment_id }
  });

  if (!comment) throw new NotFound("Comment not found");

  // 2. Cek apakah user pernah like
  const existing = await this.db.like_comments.findUnique({
    where: {
      user_id_comment_id: {
        user_id,
        comment_id
      }
    }
  });

  if (!existing) {
    throw new BadRequest("You have not liked this comment");
  }

  // 3. Hapus like
  await this.db.like_comments.delete({
    where: {
      user_id_comment_id: {
        user_id,
        comment_id
      }
    }
  });

  return {
    message: "Comment unliked successfully"
  };
};

  update = async (id, payload) => {
    const data = await this.db.comments.update({ where: { id }, data: payload });
    return data;
  };

  delete = async (id) => {
    const data = await this.db.comments.delete({ where: { id } });
    return data;
  };


findByThreadsId = async (threads_id) => {
  if (!threads_id) throw new BadRequest("threads_id is required");

  const comments = await this.db.comments.findMany({
    where: { threads_id: Number(threads_id) },
    include: {
      users: {
        select: {
          id: true,
          username: true,
          email: true,
          profile_image: true,
          bio: true,
          status: true,
          created_at: true,
          id_role: true,
          // ❌ hidden fields:
          password: false,
          refresh_token: false,
          duration: false,
        }
      },
      _count: {
        select: { like_comments: true }
      }
    }
  });

  // Jika tidak ada comment
  if (!comments || comments.length === 0) {
    return [];
  }

  // Format total like
  return comments.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    comment_desc: c.comment_desc,
    threads_id: c.threads_id,
    bind_to_comment: c.bind_to_comment,
    uploaded_file: c.uploaded_file,
    created_at: c.created_at,
    users: c.users,

    // total like
    total_like: c._count.like_comments
  }));
};

}

export default commentsService;  