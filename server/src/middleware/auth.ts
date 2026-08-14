import { RequestHandler } from "express";
import { sendErrorRes } from "src/utils/helper";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import * as dotenv from 'dotenv';
import UserModel from "src/models/user";

dotenv.config();

// custom request object
interface UserProfile {
    id: Object;
    name: string;
    email: string;
    verified: boolean;
}

declare global {
    namespace Express {
        interface Request {
            user: UserProfile
        }
    }
}

export const isAuth: RequestHandler = async(req, res, next) => {
    try{
        const authToken = req.headers.authorization;

        if(!authToken) return sendErrorRes(res, 403, "unauthorized request");
        const token = authToken.split("Bearer ")[1];

        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {userId: string};

        const user = await UserModel.findById(payload.userId)
        if(!user) return sendErrorRes(res, 403, "unauthorized request");

        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            verified: user.verified,
        }

        next();
    }catch(err){
        if(err instanceof TokenExpiredError){
            return sendErrorRes(res, 401, "Session Expired!");
        }
        if(err instanceof JsonWebTokenError){
            return sendErrorRes(res, 401, "Unauthorized Access!");
        }

        next(err);
    }
}