import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon, ImageIcon, ReelsIcon, CirclePlusIcon } from './icons.jsx';

const OPTIONS = [
  {
    mode: 'post',
    title: 'Post',
    sub: 'Share a photo or video',
    icon: ImageIcon,
    className: 'create-sheet-icon-post',
  },
  {
    mode: 'reel',
    title: 'Reel',
    sub: 'Create a short video',
    icon: ReelsIcon,
    className: 'create-sheet-icon-reel',
  },
  {
    mode: 'story',
    title: 'Story',
    sub: 'Share a moment',
    icon: CirclePlusIcon,
    className: 'create-sheet-icon-story',
  },
];

export default function CreateSheet({ onClose }) {
  const navigate = useNavigate();

  const pick = (mode) => {
    onClose();
    navigate('/create', { state: { mode } });
  };

  return (
    <div className="create-sheet-backdrop" onClick={onClose}>
      <div className="create-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="create-sheet-header">
          <span className="create-sheet-title">Create</span>
          <button className="create-sheet-close" onClick={onClose} aria-label="Close">
            <XIcon size={16} />
          </button>
        </div>

        {OPTIONS.map(({ mode, title, sub, icon: Icon, className }) => (
          <button key={mode} className="create-sheet-item" onClick={() => pick(mode)}>
            <span className={`create-sheet-icon ${className}`}>
              <Icon />
            </span>
            <span className="create-sheet-item-text">
              <span className="create-sheet-item-title">{title}</span>
              <span className="create-sheet-item-sub">{sub}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
