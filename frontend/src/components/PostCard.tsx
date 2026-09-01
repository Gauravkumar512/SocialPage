import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiClient, getErrorMessage } from '../api/client';
import type { Comment, Post } from '../types';
import { timeAgo } from '../utils/time';

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.animationDelay = `${index * 0.06}s`;
  }, [index]);

  async function handleLike() {
    setError('');
    const optimisticLiked = !likedByMe;
    setLikedByMe(optimisticLiked);
    setLikesCount((c) => c + (optimisticLiked ? 1 : -1));
    try {
      const { data } = await apiClient.post<{ likesCount: number; likedByMe: boolean }>(`/api/posts/${post.id}/like`);
      setLikedByMe(data.likedByMe);
      setLikesCount(data.likesCount);
    } catch (err) {
      setLikedByMe(!optimisticLiked);
      setLikesCount(post.likesCount);
      setError(getErrorMessage(err));
    }
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      try {
        const { data } = await apiClient.get<{ comments: Comment[] }>(`/api/posts/${post.id}/comments`);
        setComments(data.comments);
        setCommentsLoaded(true);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
  }

  async function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentText.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await apiClient.post<{ comment: Comment; commentsCount: number }>(
        `/api/posts/${post.id}/comment`,
        { text: commentText.trim() }
      );
      setComments((prev) => [...prev, data.comment]);
      setCommentsCount(data.commentsCount);
      setCommentText('');
      setCommentsLoaded(true);
      setShowComments(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card ref={cardRef} className="animate-fade-in-up" sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Author */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 38, height: 38, fontSize: 14, bgcolor: '#fce7f3', color: '#ec4899' }}>
            {post.author.username.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>
              {post.author.username}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              {timeAgo(post.createdAt)}
            </Typography>
          </Box>
        </Stack>

        {/* Text */}
        {post.text && (
          <Typography
            variant="body2"
            sx={{ mt: 1.5, whiteSpace: 'pre-wrap', color: '#475569', lineHeight: 1.65, fontSize: '0.9rem' }}
          >
            {post.text}
          </Typography>
        )}

        {/* Image */}
        {post.imageUrl && (
          <Box sx={{ mt: 2, borderRadius: 2.5, overflow: 'hidden' }}>
            <Box
              component="img"
              src={post.imageUrl}
              alt="Post attachment"
              sx={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }}
            />
          </Box>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} alignItems="center">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              onClick={handleLike}
              sx={{
                color: likedByMe ? '#ec4899' : '#94a3b8',
                '&:hover': { color: '#ec4899', backgroundColor: '#fce7f3' },
              }}
            >
              {likedByMe ? <FavoriteIcon sx={{ fontSize: 19 }} /> : <FavoriteBorderIcon sx={{ fontSize: 19 }} />}
            </IconButton>
            <Typography variant="caption" sx={{ color: likedByMe ? '#ec4899' : '#94a3b8', fontWeight: 600 }}>
              {likesCount}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              onClick={toggleComments}
              sx={{
                color: showComments ? '#ec4899' : '#94a3b8',
                '&:hover': { color: '#ec4899', backgroundColor: '#fce7f3' },
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 19 }} />
            </IconButton>
            <Typography variant="caption" sx={{ color: showComments ? '#ec4899' : '#94a3b8', fontWeight: 600 }}>
              {commentsCount}
            </Typography>
          </Stack>
        </Stack>

        {error && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            {error}
          </Typography>
        )}

        {/* Comments */}
        <Collapse in={showComments} timeout={250}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              {comments.map((comment, idx) => (
                <Box
                  key={`${comment.username}-${idx}`}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                    <Typography component="span" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                      {comment.username}{' '}
                    </Typography>
                    {comment.text}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                    {timeAgo(comment.createdAt)}
                  </Typography>
                </Box>
              ))}
              {comments.length === 0 && (
                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  No comments yet.
                </Typography>
              )}
            </Stack>
            <Box component="form" onSubmit={handleAddComment} sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 3, fontSize: '0.85rem' },
                }}
              />
              <IconButton
                type="submit"
                disabled={busy || !commentText.trim()}
                sx={{
                  color: '#ec4899',
                  '&:hover': { backgroundColor: '#fce7f3' },
                  '&.Mui-disabled': { color: '#cbd5e1' },
                }}
              >
                <SendRoundedIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
