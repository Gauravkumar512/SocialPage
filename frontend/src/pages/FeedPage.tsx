import { Alert, Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { apiClient, getErrorMessage } from '../api/client';
import { CreatePostCard } from '../components/CreatePostCard';
import { Navbar } from '../components/Navbar';
import { PostCard } from '../components/PostCard';
import type { Post } from '../types';

interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

export function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  async function loadFeed(cursor?: string | null) {
    try {
      const { data } = await apiClient.get<FeedResponse>('/api/posts', {
        params: cursor ? { cursor } : {},
      });
      setPosts((prev) => (cursor ? [...prev, ...data.posts] : data.posts));
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    setLoading(true);
    loadFeed().finally(() => setLoading(false));
  }, []);

  async function handleLoadMore() {
    setLoadingMore(true);
    await loadFeed(nextCursor);
    setLoadingMore(false);
  }

  function handlePostCreated(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <CreatePostCard onPostCreated={handlePostCreated} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress size={34} thickness={3.5} sx={{ color: '#ec4899' }} />
          </Box>
        ) : posts.length === 0 ? (
          <Box className="animate-fade-in" sx={{ textAlign: 'center', mt: 6, py: 4 }}>
            <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              No posts yet. Be the first to share something!
            </Typography>
          </Box>
        ) : (
          posts.map((post, idx) => <PostCard key={post.id} post={post} index={idx} />)
        )}

        {nextCursor && !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 3 }}>
            <Button onClick={handleLoadMore} disabled={loadingMore} variant="outlined" sx={{ px: 4 }}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
}
