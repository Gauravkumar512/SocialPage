import mongoose, { Schema, type Types } from 'mongoose';

export interface ILike {
  user: Types.ObjectId;
  username: string;
  createdAt: Date;
}

export interface IComment {
  user: Types.ObjectId;
  username: string;
  text: string;
  createdAt: Date;
}

export interface IPost {
  author: Types.ObjectId;
  authorUsername: string;
  text?: string;
  imageUrl?: string;
  imagePublicId?: string;
  likes: ILike[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const commentSchema = new Schema<IComment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorUsername: { type: String, required: true },
    text: { type: String, trim: true, maxlength: 2000 },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    likes: [likeSchema],
    comments: [commentSchema],
  },
  { timestamps: true }
);

postSchema.pre('validate', function requireTextOrImage(next) {
  if (!this.text?.trim() && !this.imageUrl) {
    next(new Error('EmptyPost'));
    return;
  }
  next();
});

postSchema.index({ author: 1, _id: -1 });
postSchema.index({ 'likes.user': 1 });
postSchema.index({ 'comments.user': 1 });

export const Post = mongoose.model<IPost>('Post', postSchema);
