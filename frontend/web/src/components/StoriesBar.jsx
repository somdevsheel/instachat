import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStories, storyApi, addStory } from '@instachat/shared';
import { uploadMediaFile } from '../utils/uploadMedia.js';
import Avatar from './Avatar.jsx';
import StoryViewer from './StoryViewer.jsx';

export default function StoriesBar() {
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.stories);
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  const [viewingGroup, setViewingGroup] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);

  const ownGroup = list.find((g) => g.user._id === user?._id);
  const otherGroups = list.filter((g) => g.user._id !== user?._id);

  const handleAddStoryClick = () => {
    if (ownGroup) {
      setViewingGroup(ownGroup);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const { key, mediaType } = await uploadMediaFile(file);
      const res = await storyApi.createStoryRecord({ key, mediaType });
      if (res?.data) {
        dispatch(addStory(res.data));
      }
    } catch (err) {
      console.error('Story upload failed:', err.message);
    } finally {
      setUploading(false);
    }
  };

  const isGroupUnseen = (group) =>
    group.stories.some((s) => !s.isSeen);

  return (
    <div className="stories-card">
      <div className="stories-bar">
        <div className="story-avatar-item" onClick={handleAddStoryClick}>
          <div className={`story-ring ${ownGroup ? (isGroupUnseen(ownGroup) ? 'unseen' : 'seen') : 'none'}`}>
            <Avatar src={user?.profilePicture} username={user?.username} size={60} />
            {!ownGroup && <span className="story-add-badge">+</span>}
          </div>
          <span className="story-username">{uploading ? 'Uploading…' : 'Your story'}</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          hidden
          onChange={handleFileChange}
        />

        {otherGroups.map((group) => (
          <div
            key={group.user._id}
            className="story-avatar-item"
            onClick={() => setViewingGroup(group)}
          >
            <div className={`story-ring ${isGroupUnseen(group) ? 'unseen' : 'seen'}`}>
              <Avatar src={group.user.profilePicture} username={group.user.username} size={60} />
            </div>
            <span className="story-username">{group.user.username}</span>
          </div>
        ))}

        {viewingGroup && (
          <StoryViewer group={viewingGroup} onClose={() => setViewingGroup(null)} />
        )}
      </div>
    </div>
  );
}
