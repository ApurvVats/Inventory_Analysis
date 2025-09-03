import { io } from "socket.io-client";
import {store} from './store/store.jsx';
const URL = process.env.NODE_ENV === 'production' 
    ? 'https://apurv-analytics-app-2025-cwbzbyfgbcbpa6aq.centralindia-01.azurewebsites.net' 
    : 'http://localhost:4000';

export const socket = io(URL, { 
    autoConnect: false,
    query: {} 
});

export const connectSocket = () => {
    // Get user from Redux store to pass userId in query
    const state = store.getState();
    const userId = state.auth.user?.id;

    if (userId) {
        socket.io.opts.query.userId = userId;
        socket.connect();
    }
};

export const disconnectSocket = () => {
    socket.disconnect();
};