import axios from "axios";

let rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
rawApiUrl = rawApiUrl.trim();
if (!rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
    rawApiUrl = "https://" + rawApiUrl;
}
if (!rawApiUrl.endsWith("/api")) {
    rawApiUrl = rawApiUrl.replace(/\/+$/, "") + "/api";
}

const api = axios.create({
    baseURL: rawApiUrl,
});

api.interceptors.request.use((config)=>{
    const token=localStorage.getItem("token");
    if(token){
        config.headers.Authorization=`Bearer ${token}`;
    }
    return config;
})
export default api;