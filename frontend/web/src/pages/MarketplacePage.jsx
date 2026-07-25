import React, { useEffect, useRef, useState } from 'react';
import { marketplaceApi } from '@instachat/shared';
import { uploadMediaFile } from '../utils/uploadMedia.js';

function CreateListingModal({ onClose, onCreated }) {
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price) return;

    setSubmitting(true);
    setError('');
    try {
      let imageKey;
      if (file) {
        const { key } = await uploadMediaFile(file);
        imageKey = key;
      }

      const res = await marketplaceApi.createListing({
        title: title.trim(),
        price: Number(price),
        category,
        location,
        description,
        imageKey,
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>New listing</h2>
        <form onSubmit={handleSubmit}>
          {preview ? (
            <div className="create-preview">
              <img src={preview} alt="preview" />
              <button
                type="button"
                className="create-change-button"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="create-dropzone" onClick={() => fileInputRef.current?.click()}>
              <p>Click to add a photo (optional)</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleFileChange}
          />

          <label className="form-label">Title</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />

          <label className="form-label">Price</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <label className="form-label">Category</label>
          <input
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Electronics"
          />

          <label className="form-label">Location</label>
          <input
            className="form-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Optional"
          />

          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {error && <div className="auth-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="follow-button" disabled={!title.trim() || !price || submitting}>
              {submitting ? 'Posting…' : 'Post listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    marketplaceApi.getListings().then((res) => setListings(res?.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="profile-page">
      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <h2 className="page-title" style={{ padding: 0 }}>Marketplace</h2>
        <button className="follow-button" onClick={() => setCreating(true)}>
          Sell something
        </button>
      </div>

      {loading && <div className="centered-message">Loading…</div>}
      {!loading && listings.length === 0 && (
        <div className="centered-message">No listings yet.</div>
      )}

      <div className="card-grid">
        {listings.map((l) => (
          <div key={l._id} className="entity-card">
            {l.image ? (
              <img src={l.image} alt={l.title} className="listing-image" />
            ) : (
              <div className="listing-image listing-image-fallback">No photo</div>
            )}
            <div className="entity-card-title">{l.title}</div>
            <div className="listing-price">${l.price}</div>
            {l.location && <div className="post-time">{l.location}</div>}
            <div className="post-time">Seller: {l.seller?.username}</div>
          </div>
        ))}
      </div>

      {creating && (
        <CreateListingModal
          onClose={() => setCreating(false)}
          onCreated={(l) => setListings((prev) => [l, ...prev])}
        />
      )}
    </div>
  );
}
