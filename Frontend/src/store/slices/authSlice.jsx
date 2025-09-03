import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { route,setAuthToken } from "../../route"; // Your axios instance
// --- THUNKS ---
export const sendRegistrationOtpThunk = createAsyncThunk(
  "auth/sendRegistrationOtp",
  async ({ username, email }, { rejectWithValue }) => {
    try {
      const { data } = await route.post("/auth/send-register-otp", { username, email });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || "Error");
    }
  }
);
export const forgotPasswordThunk = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const { data } = await route.post("/auth/forgot-password", { email });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || "Error");
    }
  }
);
export const resetPasswordThunk = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const { data } = await route.post("/auth/reset-password", { email, otp, newPassword });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || "Error");
    }
  }
);
// --- MODIFIED registerThunk ---
export const registerThunk = createAsyncThunk(
  "auth/register",
  async ({ username, email, password, otp }, { rejectWithValue }) => {
    try {
      const { data } = await route.post("/auth/register", { username, email, password, otp });
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
      localStorage.setItem("token", data.token); 
      setAuthToken(data.token);  // <--- add helper here
      return data; // returns { token, user }
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || "Login failed");
    }
  }
);
export const googleLoginThunk = createAsyncThunk(
  "auth/google-login",
  async ({ idToken }, { rejectWithValue }) => {
    try {
      // We will create this backend endpoint next
      const { data } = await route.post("/auth/google-login", { idToken });
      localStorage.setItem("token", data.token);
      setAuthToken(data.token);
      return data; // Expects { token, user } from the backend
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || "Google login failed");
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
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false;
        // Successful registration doesn't change the auth state,
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
      .addCase(googleLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLoginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(googleLoginThunk.rejected, (state, action) => {
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