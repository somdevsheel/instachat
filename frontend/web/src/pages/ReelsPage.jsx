import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReels } from '@instachat/shared';
import ReelSlide from '../components/ReelSlide.jsx';
import { PlusSquareIcon, ChevronUpIcon, ChevronDownIcon } from '../components/icons.jsx';

export default function ReelsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { reels, loading, error, pagination } = useSelector((state) => state.reels);

  const containerRef = useRef(null);
  const slideRefs = useRef(new Map());
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    dispatch(fetchReels({ page: 1 }));
  }, [dispatch]);

  const registerRef = useCallback((id, el) => {
    if (el) slideRefs.current.set(id, el);
  }, []);

  const scrollToIndex = (index) => {
    if (index < 0 || index >= reels.length) return;
    const el = slideRefs.current.get(reels[index]._id);
    el?.scrollIntoView({ behavior: 'smooth' });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // Infinite scroll: fetch the next page once near the bottom.
    const nearBottom =
      container.scrollTop + container.clientHeight > container.scrollHeight - 800;
    if (nearBottom && !loading && pagination.page < pagination.totalPages) {
      dispatch(fetchReels({ page: pagination.page + 1 }));
    }

    // Track which slide is closest to the top for the up/down buttons.
    const centerY = container.scrollTop + container.clientHeight / 2;
    let closestIndex = 0;
    let closestDist = Infinity;
    reels.forEach((reel, i) => {
      const el = slideRefs.current.get(reel._id);
      if (!el) return;
      const dist = Math.abs(el.offsetTop + el.offsetHeight / 2 - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    setActiveIndex(closestIndex);
  };

  return (
    <div className="reels-viewer-page">
      <div className="reels-top-bar">
        <span className="post-username">Reels</span>
        <button
          className="follow-button reels-create-button"
          onClick={() => navigate('/create', { state: { mode: 'reel' } })}
        >
          <PlusSquareIcon /> Create
        </button>
      </div>

      {loading && reels.length === 0 && (
        <div className="centered-message">Loading reels…</div>
      )}
      {error && <div className="centered-message">{error}</div>}
      {!loading && !error && reels.length === 0 && (
        <div className="centered-message">No reels yet.</div>
      )}

      <div className="reels-viewer" ref={containerRef} onScroll={handleScroll}>
        {reels.map((reel) => (
          <ReelSlide key={reel._id} reel={reel} registerRef={registerRef} />
        ))}
      </div>

      {reels.length > 1 && (
        <div className="reels-nav-buttons">
          <button
            className="reels-nav-button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous reel"
          >
            <ChevronUpIcon />
          </button>
          <button
            className="reels-nav-button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex >= reels.length - 1}
            aria-label="Next reel"
          >
            <ChevronDownIcon />
          </button>
        </div>
      )}
    </div>
  );
}
