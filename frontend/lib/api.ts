import axios from "axios";
import {
  SubmitRequest,
  SubmitResponse,
  Problem,
  SessionsResponse,
  AnalyticsResponse,
} from "@/types";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const submitCode = async (
  payload: SubmitRequest
): Promise<SubmitResponse> => {
  const res = await api.post<SubmitResponse>("/submit", payload);
  return res.data;
};

export const getProblems = async (): Promise<Problem[]> => {
  const res = await api.get<Problem[]>("/problems");
  return res.data;
};

export const getProblem = async (id: string): Promise<Problem> => {
  const res = await api.get<Problem>(`/problems/${id}`);
  return res.data;
};

export const getSessions = async (
  userId: string
): Promise<SessionsResponse> => {
  const res = await api.get<SessionsResponse>(`/sessions/${userId}`);
  return res.data;
};

export const getAnalytics = async (
  userId: string
): Promise<AnalyticsResponse> => {
  const res = await api.get<AnalyticsResponse>(`/analytics/${userId}`);
  return res.data;
};