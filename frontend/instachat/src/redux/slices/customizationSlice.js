// customizationSlice.js
const customizationSlice = createSlice({
  name: 'customization',
  initialState: {
    theme: 'night',
    accentColor: '#0095f6',
    borderStyle: 'instagram',
    backgroundImage: null,
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    // ... other setters
  },
});