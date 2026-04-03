import axios from "axios";

const API = "https://localhost:7247/api/notifications";

export const getNotifications = async () => {
    const token = localStorage.getItem("token");

    const response = await axios.get(API, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

export const getUnreadCount = async () => {
    const token = localStorage.getItem("token");

    const response = await axios.get(`${API}/unread-count`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};