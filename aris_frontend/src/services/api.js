import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// Configure axios instance with CORS support
const axiosInstance = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

export const getCollegeToppers = () => axiosInstance.get(`/toppers/college/`).then(res => res.data);
export const getScienceToppers = () => axiosInstance.get(`/toppers/science/`).then(res => res.data);
export const getCommerceToppers = () => axiosInstance.get(`/toppers/commerce/`).then(res => res.data);
export const getSectionToppers = () => axiosInstance.get(`/toppers/section/`).then(res => res.data);
export const getSectionToppersGrouped = () =>
  axiosInstance.get(`/section-toppers/grouped/`).then((res) => res.data);
export const getSectionToppersTop10 = () =>
  axiosInstance.get(`/section-toppers/top10/`).then((res) => res.data);
export const getSections = () => axiosInstance.get(`/sections/`).then(res => res.data);
export const getHeatmap = () => axiosInstance.get(`/heatmap/`).then(res => res.data);
export const getSubjects = () => axiosInstance.get(`/subjects/`).then(res => res.data);

export const getStatus = () => axiosInstance.get(`/status/`).then(res => res.data);

export const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(`/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
};

export const clearData = () => {
    return axiosInstance.post(`/clear/`).then(res => res.data);
};
