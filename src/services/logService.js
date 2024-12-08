import axios from "axios";

const getLogInterval = (start, end) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/getLogInterval?start=${start}&end=${end}`;
    const response = axios.get(url);
    return response
}

export default { getLogInterval }