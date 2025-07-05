import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Configure axios base URL
axios.defaults.baseURL = "http://localhost:5000";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials) => {
    const response = await axios.post("/api/auth/login", credentials);
    return response.data;
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (credentials) => {
    const response = await axios.post("/api/auth/register", credentials);
    return response.data;
  }
);

// Load initial state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('auth');
    if (serializedState === null) {
      return {
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
    };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadState(),
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      // Clear from localStorage
      localStorage.removeItem('auth');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        // Save to localStorage
        localStorage.setItem('auth', JSON.stringify({
          user: action.payload.user,
          token: action.payload.token,
          loading: false,
          error: null,
        }));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Login failed";
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Registration failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
