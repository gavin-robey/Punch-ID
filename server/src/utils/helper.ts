import { Response } from "express";

export const sendErrorRes = (res: Response, statusCode: number, message: string) => {
    return res.status(statusCode).json({ message });
}