import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeed } from '@instachat/shared';
import PostCard from '../components/PostCard.jsx';
import StoriesBar from '../components/StoriesBar.jsx';
import PostComposer from '../components/PostComposer.jsx';
import ReelsCarousel from '../components/ReelsCarousel.jsx';

export default function HomePage() {
  const dispatch = useDispatch();
  const { posts, loading, error } = useSelector((state) => state.feed);

  useEffect(() => {
    dispatch(fetchFeed());
  }, [dispatch]);

  return (
    <div className="feed">
      <StoriesBar />
      <PostComposer />
      <ReelsCarousel />

      {loading && <div className="centered-message">Loading feed…</div>}
      {error && <div className="centered-message">{error}</div>}
      {!loading && !error && posts.length === 0 && (
        <div className="centered-message">No posts yet.</div>
      )}

      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
