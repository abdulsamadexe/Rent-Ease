import axios from 'axios';

// Connects to your FastAPI backend
const api = axios.create({
    baseURL: 'http://localhost:8000',
});

export default api;