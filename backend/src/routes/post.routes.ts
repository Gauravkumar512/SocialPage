import { Router } from 'express';
import { uploadImage } from '../config/cloudinary.js';
import {
  addComment,
  createPost,
  getComments,
  getFeed,
  getMyProfile,
  getPost,
  toggleLike,
} from '../controllers/post.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', optionalAuth, asyncHandler(getFeed));
router.post('/', requireAuth, uploadImage.single('image'), asyncHandler(createPost));
router.get('/mine', requireAuth, asyncHandler(getMyProfile));
router.get('/:id', optionalAuth, asyncHandler(getPost));
router.get('/:id/comments', asyncHandler(getComments));
router.post('/:id/like', requireAuth, asyncHandler(toggleLike));
router.post('/:id/comment', requireAuth, asyncHandler(addComment));

export default router;
