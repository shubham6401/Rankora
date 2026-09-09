import axios from "axios";

let rawApiUrl = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://rankora-xbvm.onrender.com/api" : "http://localhost:8000/api");
rawApiUrl = rawApiUrl.trim();
if (!rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
    rawApiUrl = "https://" + rawApiUrl;
}
if (!rawApiUrl.endsWith("/api")) {
    rawApiUrl = rawApiUrl.replace(/\/+$/, "") + "/api";
}

const api = axios.create({
    baseURL: rawApiUrl,
    timeout: 30000,
});

api.interceptors.request.use((config)=>{
    const token=localStorage.getItem("token");
    if(token){
        config.headers.Authorization=`Bearer ${token}`;
    }
    return config;
});

// Non-blocking background health check to pre-warm backend connection
if (typeof window !== "undefined") {
    setTimeout(() => {
        api.get("/health").catch(() => {});
    }, 50);
}

export default api;