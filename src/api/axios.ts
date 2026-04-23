import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_API_BASEURL;
axios.defaults.withCredentials = true;

export default axios;
