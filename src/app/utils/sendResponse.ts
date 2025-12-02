import { Response } from "express";

type TMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPage?: number;
};

type TApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
  meta?: TMeta;
};

export const sendResponse = <T>(res: Response, payload: TApiResponse<T>) => {
  const { statusCode, success, message, data, meta } = payload;
  res.status(statusCode).json({
    success,
    message,
    meta,
    data,
  });
};


