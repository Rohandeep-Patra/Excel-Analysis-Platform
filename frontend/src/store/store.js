import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Subscribe to store changes and save to localStorage
store.subscribe(() => {
  const state = store.getState();
  if (state.auth.user && state.auth.token) {
    localStorage.setItem('auth', JSON.stringify({
      user: state.auth.user,
      token: state.auth.token,
      loading: false,
      error: null,
    }));
  }
});

export default store;
