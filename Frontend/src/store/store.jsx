import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import authReducer from './slices/authSlice';

// Persist Configuration
const persistConfig = {
  key: 'root', // The key for the persist object in storage
  storage,
  whitelist: ['auth'], // Only the 'auth' slice will be persisted
};

// Combine all your reducers here
const rootReducer = combineReducers({
  auth: authReducer,
  // ... other reducers can be added here
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types, or you'll get errors
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export const persistor = persistStore(store);
