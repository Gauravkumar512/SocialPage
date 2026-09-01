import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { apiClient, getErrorMessage } from '../api/client';
import { Navbar } from '../components/Navbar';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import type { CommentedPost, MyProfileResponse } from '../types';
import { timeAgo } from '../utils/time';

function CommentedPostCard({ post }: { post: CommentedPost }) {
  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
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

        {post.text && (
          <Typography variant="body2" sx={{ mt: 1.5, color: '#64748b', lineHeight: 1.6, fontSize: '0.88rem' }}>
            {post.text}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1.5}>
          {post.myComments.map((comment, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                borderLeft: '3px solid #ec4899',
              }}
            >
              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                <Typography component="span" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                  Your comment:{' '}
                </Typography>
                {comment.text}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                {timeAgo(comment.createdAt)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState<MyProfileResponse | null>(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get<MyProfileResponse>('/api/posts/mine')
      .then(({ data }) => setData(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  function handleTabChange(_event: SyntheticEvent, value: number) {
    setTab(value);
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ py: 3 }}>
        {/* Profile Header */}
        <Card className="animate-fade-in-up" sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  fontSize: 26,
                  bgcolor: '#fce7f3',
                  color: '#ec4899',
                  fontFamily: 'Outfit, Inter, sans-serif',
                  fontWeight: 700,
                }}
              >
                {user?.username.slice(0, 2).toUpperCase()}
              </Avatar>
            </Box>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, mb: 0.5 }}>
              {user?.username}
            </Typography>
            {user?.createdAt && (
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Joined {timeAgo(user.createdAt)}
              </Typography>
            )}

            {/* Stats */}
            {data && (
              <Stack
                direction="row"
                justifyContent="center"
                spacing={5}
                sx={{ mt: 2.5, pt: 2.5, borderTop: '1px solid #edf0f7' }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#ec4899', fontWeight: 700, fontSize: '1.15rem' }}>
                    {data.posts.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    Posts
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#ec4899', fontWeight: 700, fontSize: '1.15rem' }}>
                    {data.likedPosts.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    Liked
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#ec4899', fontWeight: 700, fontSize: '1.15rem' }}>
                    {data.commentedPosts.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    Comments
                  </Typography>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={34} thickness={3.5} sx={{ color: '#ec4899' }} />
          </Box>
        ) : data ? (
          <>
            <Card sx={{ mb: 3, p: 0 }}>
              <Tabs
                value={tab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ minHeight: 46, '& .MuiTab-root': { minHeight: 46 } }}
              >
                <Tab label={`Posts (${data.posts.length})`} />
                <Tab label={`Liked (${data.likedPosts.length})`} />
                <Tab label={`Comments (${data.commentedPosts.length})`} />
              </Tabs>
            </Card>

            {tab === 0 &&
              (data.posts.length ? (
                data.posts.map((post, idx) => <PostCard key={post.id} post={post} index={idx} />)
              ) : (
                <EmptyState text="You haven't posted anything yet." />
              ))}

            {tab === 1 &&
              (data.likedPosts.length ? (
                data.likedPosts.map((post, idx) => <PostCard key={post.id} post={post} index={idx} />)
              ) : (
                <EmptyState text="You haven't liked anything yet." />
              ))}

            {tab === 2 &&
              (data.commentedPosts.length ? (
                data.commentedPosts.map((post) => <CommentedPostCard key={post.id} post={post} />)
              ) : (
                <EmptyState text="You haven't commented on anything yet." />
              ))}
          </>
        ) : null}
      </Container>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Box className="animate-fade-in" sx={{ textAlign: 'center', py: 5 }}>
      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
        {text}
      </Typography>
    </Box>
  );
}
