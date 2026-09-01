import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  username: string;
  email: string;
  password: string;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  compareRefreshToken(candidate: string): Promise<boolean>;
  toPublicJSON(): PublicUser;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

type UserModel = Model<IUser, object, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashSecrets(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  if (this.isModified('refreshToken') && this.refreshToken) {
    this.refreshToken = await bcrypt.hash(this.refreshToken, 12);
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(this: UserDocument, candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.compareRefreshToken = function compareRefreshToken(this: UserDocument, candidate: string) {
  if (!this.refreshToken) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.refreshToken);
};

userSchema.methods.toPublicJSON = function toPublicJSON(this: UserDocument): PublicUser {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
