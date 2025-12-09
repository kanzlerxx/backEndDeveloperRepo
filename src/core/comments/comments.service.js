import BaseService from "../../base/service.base.js";
import prisma from '../../config/prisma.db.js';
import { createClient } from "@supabase/supabase-js";
import { NotFound,BadRequest } from "../../exceptions/catch.execption.js";


const checkIsCommentLiked = (comment, userId) => {
  if (!userId) return false; // guest atau tidak login
  return comment.like_comments?.some(like => like.user_id === userId) || false;
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

class commentsService extends BaseService {
  constructor() {
    super(prisma);
  }

findAll = async (query, userId) => {
  const q = this.transformBrowseQuery(query);

  const data = await this.db.comments.findMany({
    ...q,
    include: {
      like_comments: true,
          users: {
        select: {
          id: true,
          username: true,
          profile_image: true,
          bio: true,
        }
      }, 
      _count: { select: { like_comments: true }},
    }
  });

  return data.map(c => {
    const { _count, like_comments, ...rest } = c;

    return {
      ...rest,
      total_like: _count.like_comments,
      is_liked: checkIsCommentLiked(c, userId),
    };
  });
};

findById = async (id, userId) => {
  const data = await this.db.comments.findUnique({
    where: { id },
    include: {
      like_comments: true,
         users: {
        select: {
          id: true,
          username: true,
          profile_image: true,
          bio: true,
        }
      }, 
      _count: { select: { like_comments: true }},
    }
  });

  if (!data) return null;

  const { _count, like_comments, ...rest } = data;

  return {
    ...rest,
    total_like: _count.like_comments,
    is_liked: checkIsCommentLiked(data, userId),
  };
};


createComment = async (payload, file, user_id) => {
  const { comment_desc, threads_id, bind_to_comment } = payload;

  if (!user_id) throw new BadRequest("Unauthorized");

  const comment = await this.db.comments.create({
    data: {
      user_id,
      comment_desc,
      threads_id: Number(threads_id),
      bind_to_comment: bind_to_comment ? Number(bind_to_comment) : null,
    },
    include: {
      like_comments: true,
      _count: { select: { like_comments: true }},
    }
  });

  let formatted = {
    ...comment,
    total_like: 0,
    is_liked: false,       // selalu false saat create
  };

  // Jika tidak upload file
  if (!file) return formatted;

  // Upload file ke Supabase
  const uploadPath = `comments/${comment.id}-${Date.now()}`;

  const { error } = await supabase.storage
    .from("image")
    .upload(uploadPath, file.buffer, {
      contentType: file.mimetype
    });

  if (error) throw new Error("Upload failed: " + error.message);

  const publicUrl = supabase.storage.from("image")
    .getPublicUrl(uploadPath).data.publicUrl;

  const updated = await this.db.comments.update({
    where: { id: comment.id },
    data: { uploaded_file: publicUrl },
    include: {
      like_comments: true,
      _count: { select: { like_comments: true }},
    }
  });

  return {
    ...updated,
    total_like: updated._count.like_comments,
    is_liked: false
  };
};


findReplies = async (comment_id, userId) => {
  const replies = await this.db.comments.findMany({
    where: {
      bind_to_comment: Number(comment_id)
    },
    include: {
      like_comments: true,
      users: {
        select: {
          id: true,
          username: true,
          profile_image: true,
          bio: true,
        }
      },
      _count: {
        select: { like_comments: true }
      }
    },
    orderBy: {
      id: "asc"
    }
  });

  return replies.map(r => ({
    ...r,
    total_like: r._count.like_comments,
    is_liked: checkIsCommentLiked(r, userId)
  }));
};




likeComment = async ({ comment_id, user_id }) => {
  const comment = await this.db.comments.findUnique({
    where: { id: comment_id },
    include: { like_comments: true }
  });

  if (!comment) throw new NotFound("Comment not found");

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

  await this.db.like_comments.create({
    data: { user_id, comment_id }
  });

  // ambil lagi untuk hitung ulang
  const updated = await this.db.comments.findUnique({
    where: { id: comment_id },
    include: {
      like_comments: true,
      _count: { select: { like_comments: true }}
    }
  });

  return {
    ...updated,
    total_like: updated._count.like_comments,
    is_liked: true,
  };
};


unlikeComment = async ({ comment_id, user_id }) => {
  const existing = await this.db.like_comments.findUnique({
    where: {
      user_id_comment_id: { user_id, comment_id }
    }
  });

  if (!existing) throw new BadRequest("You have not liked this comment");

  await this.db.like_comments.delete({
    where: {
      user_id_comment_id: { user_id, comment_id }
    }
  });

  const updated = await this.db.comments.findUnique({
    where: { id: comment_id },
    include: {
      like_comments: true,
      _count: { select: { like_comments: true }}
    }
  });

  return {
    ...updated,
    total_like: updated._count.like_comments,
    is_liked: false
  };
};


update = async (id, payload, userId) => {
  const updated = await this.db.comments.update({
    where: { id: Number(id) },
    data: payload,
    include: {
      like_comments: true,
      _count: {
        select: { like_comments: true }
      }
    }
  });

  return {
    ...updated,
    total_like: updated._count.like_comments,
    is_liked: checkIsCommentLiked(updated, userId)
  };
};

  delete = async (id) => {
    const data = await this.db.comments.delete({ where: { id } });
    return data;
  };


findByThreadsId = async (threads_id, userId) => {
  const comments = await this.db.comments.findMany({
    where: { threads_id: Number(threads_id) },
    include: {
      like_comments: true,
      users: {
        select: {
          id: true,
          username: true,
          profile_image: true,
          bio: true,
        }
      },
      _count: {
        select: { like_comments: true }
      }
    },
    orderBy: { id: "asc" }
  });

  return comments.map(c => ({
    ...c,
    total_like: c._count.like_comments,
    is_liked: checkIsCommentLiked(c, userId)
  }));
};


}

export default commentsService;  