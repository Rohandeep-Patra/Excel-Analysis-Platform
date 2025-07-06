import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

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

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put("/api/auth/profile", profileData, {
        headers: { 'x-auth-token': token }
      });
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message);
    }
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
        isAuthenticated: false,
      };
    }
    const parsedState = JSON.parse(serializedState);
    return {
      user: parsedState.user || null,
      token: parsedState.token || null,
      loading: false,
      error: null,
      isAuthenticated: !!parsedState.token,
    };
  } catch (err) {
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadState(),
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      
      const authData = {
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
        isAuthenticated: true,
      };
      
      localStorage.setItem('auth', JSON.stringify(authData));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
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
        state.isAuthenticated = true;
        
        const authData = {
          user: action.payload.user,
          token: action.payload.token,
          loading: false,
          error: null,
          isAuthenticated: true,
        };
        
        localStorage.setItem('auth', JSON.stringify(authData));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Login failed";
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
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
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        
        // Update localStorage
        const authData = {
          user: action.payload.user,
          token: state.token,
          loading: false,
          error: null,
          isAuthenticated: true,
        };
        
        localStorage.setItem('auth', JSON.stringify(authData));
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload || 'Profile update failed';
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } =
  authSlice.actions;

export default authSlice.reducer;
