import { RequestHandler } from "express";
import UserModel from "models/user";
import crypto from "crypto";
import AuthVerificationTokenModel from "models/authVerificationToken";
import * as dotenv from 'dotenv';
import Nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import { sendErrorRes } from "src/utils/helper";
import jwt from "jsonwebtoken";

dotenv.config();

export const createNewUser : RequestHandler = async(req, res) => {
    const { email, password, name } = req.body;

    const existingUser = await UserModel.findOne({ email })
    if(existingUser) return sendErrorRes(res, 409, "User already exists");
    const newUser = await UserModel.create({ email, password, name });

    // Creates a verification token for the new user and saves it to the database
    const verificationToken = crypto.randomBytes(36).toString("hex");
    const authVerificationToken = new AuthVerificationTokenModel({ 
            owner: newUser._id, 
            token: verificationToken 
        });
    await authVerificationToken.save();
    const link = `${process.env.BASE_URL}${process.env.PORT}/auth/verify?id=${newUser._id}&token=${verificationToken}`;
    
    const transport = Nodemailer.createTransport(
        MailtrapTransport({
            token: process.env.MAILTRAP_TOKEN || "",
            sandbox: true,
            testInboxId: 4855078,
        })
    );

    const sender = {
        address: "verification@punchid.com",
        name: "Account Verification",
    };

    await transport.sendMail({
        from: sender,
        to: newUser.email,
        subject: "Verify your account",
        html: `<h1>Verify your account</h1><a href='${link}'>Verify Email</a>`,
    })

    res.json({ message: "Please check your email to verify your account" });
} 

export const verifyUser : RequestHandler = async(req, res) => {
    const { id, token } = req.body;

    const savedToken = await AuthVerificationTokenModel.findOne({ owner: id });
    if(!savedToken) return sendErrorRes(res, 400, "Invalid or expired token");

    const isValid = await savedToken.compareToken(token);
    if(!isValid) return sendErrorRes(res, 400, "Invalid or expired token");

    await UserModel.findByIdAndUpdate(id, { verified: true });
    await AuthVerificationTokenModel.findByIdAndDelete(savedToken._id);

    res.json({ message: "Account verified successfully" });
} 

export const signIn : RequestHandler = async(req, res) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if(!user) return sendErrorRes(res, 404, "User not found");

    const isMatch = await user.comparePassword(password);
    if(!isMatch) return sendErrorRes(res, 401, "Invalid credentials");

    if(!user.verified) return sendErrorRes(res, 403, "Please verify your account before signing in");

    const accessToken = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string);

    if(!user.tokens) user.tokens = [refreshToken]
    else user.tokens.push(refreshToken)

    await user.save();

    res.json({ 
        profile: {
            id: user._id,
            email: user.email,
            name: user.name,
            verified: user.verified
        },
        tokens: {
            refresh: refreshToken, 
            access: accessToken
        }
    });
} 

export const sendProfile : RequestHandler = async(req, res) => {
    res.json({
        profile: req.user
    })
} 