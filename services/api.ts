import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.1.4:5000/api", 
  timeout: 10000,
});

export default API;
