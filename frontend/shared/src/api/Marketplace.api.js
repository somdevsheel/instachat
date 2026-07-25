import api from '../services/api';

export const getListings = async () => {
  const res = await api.get('/marketplace');
  return res.data;
};

export const createListing = async ({ title, description, price, category, location, imageKey }) => {
  const res = await api.post('/marketplace', {
    title,
    description,
    price,
    category,
    location,
    imageKey,
  });
  return res.data;
};

export const getListingById = async (listingId) => {
  const res = await api.get(`/marketplace/${listingId}`);
  return res.data;
};

export const deleteListing = async (listingId) => {
  const res = await api.delete(`/marketplace/${listingId}`);
  return res.data;
};
