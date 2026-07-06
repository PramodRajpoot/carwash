import axios from 'axios';

// IMPORTANT: For Android emulator, use 10.0.2.2 instead of localhost or carwash.local.
// For physical devices or iOS simulators on the same network, use your machine's local IP address (e.g., 192.168.1.X)
// We default to the localhost or domain for the web context, but in React Native you typically need a real IP or 10.0.2.2.
const API_BASE_URL = 'http://carwash.local/api'; 

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

export default api;
