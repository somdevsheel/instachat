import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userApi } from '@instachat/shared';
import Avatar from '../components/Avatar.jsx';
import { SearchIcon } from '../components/icons.jsx';

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.query || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSearch = async (q) => {
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res = await userApi.searchUsers(q);
      setResults(res?.data || res?.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.query) runSearch(location.state.query.trim());
  }, [location.state?.query]);

  const handleSearch = async (e) => {
    e.preventDefault();
    runSearch(query.trim());
  };

  const handleFollow = async (userId) => {
    setResults((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, isFollowing: !u.isFollowing } : u))
    );
    try {
      await userApi.followUser(userId);
    } catch (err) {
      // revert on failure
      setResults((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isFollowing: !u.isFollowing } : u))
      );
    }
  };

  return (
    <div className="search-page">
      <form className="search-bar" onSubmit={handleSearch}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Search users…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {loading && <div className="centered-message">Searching…</div>}
      {error && <div className="centered-message">{error}</div>}
      {!loading && !error && results.length === 0 && query && (
        <div className="centered-message">No users found.</div>
      )}

      <ul className="search-results">
        {results.map((u) => (
          <li key={u._id} className="search-result">
            <button
              className="search-result-user"
              onClick={() => navigate(`/profile/${u.username}`)}
            >
              <Avatar src={u.profilePicture} username={u.username} size={40} />
              <div>
                <div className="post-username">{u.username}</div>
                {u.fullName && <div className="post-time">{u.fullName}</div>}
              </div>
            </button>
            <button
              className={`follow-button ${u.isFollowing ? 'following' : ''}`}
              onClick={() => handleFollow(u._id)}
            >
              {u.isFollowing ? 'Following' : 'Follow'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
