import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { route,setAuthToken } from "../../route"; // Your axios instance

// --- THUNKS ---

// NEW: Thunk for user registration
export const registerThunk = createAsyncThunk(
  "auth/register",
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await route.post("/auth/register", {
        username,
        email,
        password,
      });
      // On successful registration, we don't automatically log in.
      // We just return the success message or user data.
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || "Registration failed");
    }
  }
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const { data } = await route.post("/auth/login", { username, password });
      localStorage.setItem("token", data.token); // Persist token
      setAuthToken(data.token);  // <--- add helper here
      return data; // returns { token, user }
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || "Login failed");
    }
  }
);

export const meThunk = createAsyncThunk(
  "auth/me",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || localStorage.getItem("token");
      const { data } = await route.get("/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return data;
    } catch (e) {
      localStorage.removeItem("token");
      return rejectWithValue(e.response?.data?.error || "Session expired");
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await route.post("/auth/logout");
    } finally {
      // Always clear the token locally, even if the backend call fails
      localStorage.removeItem("token");
    }
  }
);

// --- SLICE DEFINITION ---
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // NEW: Register handlers
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false;
        // Successful registration doesn't change the auth state,
        // it just means the user can now log in.
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.token = null;
      })
      // Fetch Me
      .addCase(meThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(meThunk.rejected, (state) => {
        state.user = null;
        state.token = null;
      })
      // Logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
      });
  },
});

export const { setToken } = authSlice.actions;
export default authSlice.reducer;
