import Axios from "../Api/Axios.jsx";

export const signup = async (data) => {
  try {
    const response = await Axios.post("/auth/signup", data);
    // console.log("response from signup", response);
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const checkAuth = async () => {
  try {
    const response = await Axios.get("/auth/check-auth");
    return response;
  } catch (error) {
    return error;
  }
};

export const login = async (credentials) => {
  try {
    const { email, password } = credentials;
    const response = await Axios.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error logging in";
  }
};

export const logout = async () => {
  try {
    await Axios.post("/auth/logout");
  } catch (error) {
    throw "Error logging out";
  }
};
