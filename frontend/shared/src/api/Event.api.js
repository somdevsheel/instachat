import api from '../services/api';

export const getEvents = async () => {
  const res = await api.get('/events');
  return res.data;
};

export const createEvent = async ({ name, description, date, location }) => {
  const res = await api.post('/events', { name, description, date, location });
  return res.data;
};

export const getEventById = async (eventId) => {
  const res = await api.get(`/events/${eventId}`);
  return res.data;
};

export const toggleRsvp = async (eventId) => {
  const res = await api.put(`/events/${eventId}/rsvp`);
  return res.data;
};
