import axios from "axios";
import { tenantHeaders, tenantId } from "./tenant";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: tenantHeaders,
});

export const loginUser = (data) =>
  API.post("/users/login", { ...data, tenant: tenantId });

export const signUpUser = (data) =>
  API.post("/users/register", { ...data, tenant: tenantId });

export const bookAppointment = (data, token) =>
  API.post("/appointments/book", data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

export default API;
