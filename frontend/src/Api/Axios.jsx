import axios from 'axios'
import React from 'react'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8493";
const Axios = axios.create({
    baseURL: BASE_URL+`/api`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
})

export default Axios
