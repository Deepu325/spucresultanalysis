import axios from 'axios';

const API_BASE = "http://127.0.0.1:8000/api";

export const getCollegeToppers = () => axios.get(`${API_BASE}/toppers/college/`).then(res => res.data);
export const getScienceToppers = () => axios.get(`${API_BASE}/toppers/science/`).then(res => res.data);
export const getCommerceToppers = () => axios.get(`${API_BASE}/toppers/commerce/`).then(res => res.data);
export const getSectionToppers = () => axios.get(`${API_BASE}/toppers/section/`).then(res => res.data);
export const getSectionToppersGrouped = () =>
  axios.get(`${API_BASE}/section-toppers/grouped/`).then((res) => res.data);
export const getSectionToppersTop10 = () =>
  axios.get(`${API_BASE}/section-toppers/top10/`).then((res) => res.data);
export const getSections = () => axios.get(`${API_BASE}/sections/`).then(res => res.data);
export const getHeatmap = () => axios.get(`${API_BASE}/heatmap/`).then(res => res.data);
export const getSubjects = () => axios.get(`${API_BASE}/subjects/`).then(res => res.data);

export const getStatus = () => axios.get(`${API_BASE}/status/`).then(res => res.data);

export const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_BASE}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
};

export const clearData = () => {
    return axios.post(`${API_BASE}/clear/`).then(res => res.data);
};
