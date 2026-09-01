import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import { Post, type IComment, type ILike } from '../models/Post.js';
import { User } from '../models/User.js';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const PROFILE_LIST_LIMIT = 50;

interface PostLean {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorUsername: string;
  text?: string;
  imageUrl?: string;
  likes: ILike[];
  comments: IComment[];
  createdAt: Date;
}

function serializePost(post: PostLean, viewerId?: string) {
  return {
    id: post._id,
    author: {
      id: post.author,
      username: post.authorUsername,
    },
    text: post.text ?? '',
    imageUrl: post.imageUrl ?? null,
    likesCount: post.likes.length,
    commentsCount: post.comments.length,
    likedByMe: viewerId ? post.likes.some((like) => like.user.toString() === viewerId) : false,
    comments: post.comments.slice(-3).map((comment) => ({
      username: comment.username,
      text: comment.text,
      createdAt: comment.createdAt,
    })),
    createdAt: post.createdAt,
  };
}

export async function createPost(req: Request, res: Response) {
  const text = req.body?.text?.trim();

  if (!text && !req.file) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Post needs text, an image, or both',
    });
  }

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'User not found',
    });
  }

  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  if (req.file) {
    const image = await uploadBufferToCloudinary(req.file.buffer);
    imageUrl = image.secure_url;
    imagePublicId = image.public_id;
  }

  const post = await Post.create({
    author: user._id,
    authorUsername: user.username,
    text: text || undefined,
    imageUrl,
    imagePublicId,
  });

  res.status(201).json({
    post: serializePost(post.toObject(), req.userId),
  });
}

export async function getFeed(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const cursor = req.query.cursor as string | undefined;

  const filter: mongoose.FilterQuery<PostLean> = {};

  if (cursor && mongoose.isValidObjectId(cursor)) {
    filter._id = {
      $lt: new mongoose.Types.ObjectId(cursor),
    };
  }

  const posts = await Post.find(filter).sort({ _id: -1 }).limit(limit).lean<PostLean[]>();

  const nextCursor = posts.length === limit ? posts[posts.length - 1]?._id : null;

  res.json({
    posts: posts.map((post) => serializePost(post, req.userId)),
    nextCursor,
  });
}

export async function getMyProfile(req: Request, res: Response) {
  const userId = req.userId as string;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [posts, likedPosts, commentedPosts] = await Promise.all([
    Post.find({ author: userObjectId }).sort({ _id: -1 }).limit(PROFILE_LIST_LIMIT).lean<PostLean[]>(),

    Post.find({ 'likes.user': userObjectId }).sort({ _id: -1 }).limit(PROFILE_LIST_LIMIT).lean<PostLean[]>(),

    Post.find({ 'comments.user': userObjectId }).sort({ _id: -1 }).limit(PROFILE_LIST_LIMIT).lean<PostLean[]>(),
  ]);

  res.json({
    posts: posts.map((post) => serializePost(post, userId)),

    likedPosts: likedPosts.map((post) => serializePost(post, userId)),

    commentedPosts: commentedPosts.map((post) => ({
      ...serializePost(post, userId),
      myComments: post.comments
        .filter((comment) => comment.user.toString() === userId)
        .map((comment) => ({
          text: comment.text,
          createdAt: comment.createdAt,
        })),
    })),
  });
}

export async function getPost(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Post not found',
    });
  }

  const post = await Post.findById(id).lean<PostLean>();

  if (!post) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Post not found',
    });
  }

  res.json({
    post: serializePost(post, req.userId),
  });
}

export async function getComments(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Post not found',
    });
  }

  const post = await Post.findById(id).select('comments').lean<{ comments: IComment[] }>();

  if (!post) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Post not found',
    });
  }

  res.json({
    comments: post.comments.map((comment) => ({
      username: comment.username,
      text: comment.text,
      createdAt: comment.createdAt,
    })),
  });
}

export async function toggleLike(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Post not found',
    });
  }

  const post = await Post.findById(id);

  if (!post) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Post not found',
    });
  }

  const likeIndex = post.likes.findIndex((like) => like.user.toString() === req.userId);

  let likedByMe = false;

  if (likeIndex !== -1) {
    post.likes.splice(likeIndex, 1);
  } else {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'User not found',
      });
    }

    post.likes.push({
      user: user._id,
      username: user.username,
      createdAt: new Date(),
    });

    likedByMe = true;
  }

  await post.save();

  res.json({
    likesCount: post.likes.length,
    likedByMe,
  });
}

export async function addComment(req: Request<{ id: string }, unknown, { text?: string }>, res: Response) {
  const { id } = req.params;
  const text = req.body?.text?.trim();

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Post not found',
    });
  }

  if (!text) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Comment text is required',
    });
  }

  const post = await Post.findById(id);

  if (!post) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Post not found',
    });
  }

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'User not found',
    });
  }

  const comment: IComment = {
    user: user._id,
    username: user.username,
    text,
    createdAt: new Date(),
  };

  post.comments.push(comment);
  await post.save();

  res.status(201).json({
    comment,
    commentsCount: post.comments.length,
  });
}
