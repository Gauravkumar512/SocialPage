import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { apiClient, getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';

/* ───── tiny inline keyframes (scoped to this component) ───── */
const shimmerKf = `
@keyframes createpost-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes createpost-pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(236,72,153,0.25); }
  50%       { box-shadow: 0 0 0 6px rgba(236,72,153,0); }
}
@keyframes createpost-fade-scale {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
`;

export function CreatePostCard({ onPostCreated }: { onPostCreated: (post: Post) => void }) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() && !image) {
      setError('Write something or add an image to post.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (image) formData.append('image', image);

      const { data } = await apiClient.post<{ post: Post }>('/api/posts', formData);
      onPostCreated(data.post);
      setText('');
      clearImage();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const hasContent = text.trim().length > 0 || !!image;

  return (
    <>
      {/* inject keyframes once */}
      <style>{shimmerKf}</style>

      <Card
        className="animate-fade-in-up"
        sx={{
          mb: 3,
          position: 'relative',
          overflow: 'visible',
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid',
          borderColor: isFocused ? 'rgba(236,72,153,0.25)' : 'rgba(237,240,247,0.8)',
          boxShadow: isFocused
            ? '0 8px 32px rgba(236,72,153,0.10), 0 1px 3px rgba(0,0,0,0.04)'
            : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
          transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
          borderRadius: '18px',
        }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            {/* ── Avatar + Input ── */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  fontSize: 14,
                  bgcolor: '#fce7f3',
                  color: '#ec4899',
                  flexShrink: 0,
                }}
              >
                {user?.username.slice(0, 2).toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  placeholder="What's on your mind?"
                  multiline
                  minRows={2}
                  maxRows={8}
                  fullWidth
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '0.93rem',
                      color: '#334155',
                      p: 0,
                      lineHeight: 1.7,
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#a1adc2',
                      opacity: 1,
                      fontStyle: 'italic',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* ── Image Preview ── */}
            {preview && (
              <Box
                sx={{
                  position: 'relative',
                  mt: 2,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  animation: 'createpost-fade-scale 0.3s ease forwards',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              >
                <Box
                  component="img"
                  src={preview}
                  alt="Selected preview"
                  sx={{
                    width: '100%',
                    maxHeight: 260,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                {/* dark scrim at top for close button */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 48,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />
                <IconButton
                  size="small"
                  onClick={clearImage}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.55)',
                    color: '#fff',
                    backdropFilter: 'blur(4px)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(239,68,68,0.85)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            {/* ── Error ── */}
            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

            {/* ── Action Bar ── */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 2,
                pt: 1.5,
                borderTop: '1px solid',
                borderColor: 'rgba(237,240,247,0.7)',
              }}
            >
              {/* left icons */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Add image" arrow>
                  <IconButton
                    component="label"
                    sx={{
                      color: '#94a3b8',
                      borderRadius: '10px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: '#ec4899',
                        backgroundColor: 'rgba(252,231,243,0.7)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <ImageIcon />
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* character hint */}
              {text.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: text.length > 280 ? '#ef4444' : '#cbd5e1',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    mr: 1.5,
                    transition: 'color 0.2s ease',
                    userSelect: 'none',
                  }}
                >
                  {text.length}
                </Typography>
              )}

              {/* Post button — gradient shimmer */}
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || !hasContent}
                endIcon={
                  <SendRoundedIcon
                    sx={{
                      fontSize: '15px !important',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                }
                sx={{
                  px: 3,
                  py: 0.9,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.02em',
                  textTransform: 'none',
                  color: '#fff',
                  background: hasContent ? 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' : '#e2e8f0',
                  backgroundSize: '200% 100%',
                  boxShadow: hasContent ? '0 4px 14px rgba(236,72,153,0.30)' : 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: hasContent ? 'linear-gradient(135deg, #db2777 0%, #9333ea 100%)' : '#e2e8f0',
                    boxShadow: hasContent ? '0 6px 20px rgba(236,72,153,0.40)' : 'none',
                    transform: hasContent ? 'translateY(-1px)' : 'none',
                    '& .MuiButton-endIcon svg': {
                      transform: 'translateX(2px)',
                    },
                  },
                  '&:active': {
                    transform: 'translateY(0) scale(0.98)',
                  },
                  '&.Mui-disabled': {
                    color: '#94a3b8',
                    background: '#f1f5f9',
                    boxShadow: 'none',
                  },
                  /* shimmer sweep overlay */
                  '&::after': hasContent
                    ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'createpost-shimmer 3s ease-in-out infinite',
                        pointerEvents: 'none',
                        borderRadius: 'inherit',
                      }
                    : {},
                }}
              >
                {submitting ? 'Posting…' : 'Post'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
