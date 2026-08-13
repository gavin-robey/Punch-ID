import { RequestHandler } from "express";
import UserModel from "models/user";
import crypto from "crypto";
import AuthVerificationTokenModel from "models/authVerificationToken";
import * as dotenv from 'dotenv';

dotenv.config();

export const createNewUser : RequestHandler = async(req, res) => {
    const { email, password, name } = req.body;

    if (!email) return res.status(422).json({ message: "Missing email" });
    if (!password) return res.status(422).json({ message: "Missing password" });
    if (!name) return res.status(422).json({ message: "Missing name" });

    const existingUser = await UserModel.findOne({ email })
    if(existingUser) return res.status(409).json({ message: "User already exists" });

    // Creates a new user and saves it to the database
    const newUser = await UserModel.create({ email, password, name });
    newUser.comparePassword

    // Creates a verification token for the new user and saves it to the database
    const verificationToken = crypto.randomBytes(36).toString("hex");
    const authVerificationToken = new AuthVerificationTokenModel({ 
            owner: newUser._id, 
            token: verificationToken 
        });
    await authVerificationToken.save();

    // Sends verification email to verify token
    const link = `${process.env.BASE_URL}${process.env.PORT}/auth/verify?id=${newUser._id}&token=${verificationToken}`;
    res.status(200).json({ link });
}