import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReels } from '@instachat/shared';
import { PlaySolidIcon, ChevronRightIcon } from './icons.jsx';
import { formatCount } from '../utils/formatCount.js';

export default function ReelsCarousel() {
  const dispatch = useDispatch();
  const { reels } = useSelector((state) => state.reels);
  const rowRef = useRef(null);

  useEffect(() => {
    if (reels.length === 0) dispatch(fetchReels({ page: 1 }));
  }, [dispatch, reels.length]);

  if (reels.length === 0) return null;

  const scrollNext = () => {
    rowRef.current?.scrollBy({ left: 340, behavior: 'smooth' });
  };

  return (
    <div className="reels-carousel-card">
      <div className="reels-carousel-header">
        <span className="reels-carousel-title">Reels</span>
        <Link to="/reels" className="reels-carousel-see-all">
          See all <ChevronRightIcon />
        </Link>
      </div>
      <div className="reels-carousel-row" ref={rowRef}>
        {reels.slice(0, 8).map((reel) => (
          <Link key={reel._id} to="/reels" className="reels-carousel-item">
            {reel.thumbnailUrl ? (
              <img src={reel.thumbnailUrl} alt="" />
            ) : (
              <video src={reel.videoUrl} muted preload="metadata" />
            )}
            <div className="reels-carousel-overlay" />
            <span className="reels-carousel-play-badge">
              <PlaySolidIcon size={11} />
            </span>
            <span className="reels-carousel-views">
              <PlaySolidIcon size={11} /> {formatCount(reel.viewsCount)}
            </span>
          </Link>
        ))}
      </div>
      {reels.length > 3 && (
        <button className="reels-carousel-next-btn" onClick={scrollNext} aria-label="Next reels">
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
}
