/**
 * Authentication Controller
 * Handles user registration, login, token management, and email verification
 */

import { RequestHandler } from "express";
import UserModel from "models/user";
import crypto from "crypto";
import AuthVerificationTokenModel from "models/authVerificationToken";
import * as dotenv from 'dotenv';
import { sendErrorRes } from "src/utils/helper";
import jwt from "jsonwebtoken";
import mail from "src/utils/mail";
import PasswordResetTokenModel from "src/models/passwordResetToken";
import { v2 as cloudinary } from 'cloudinary';
import { isValidObjectId } from "mongoose";

dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME!,
    api_key: process.env.CLOUD_KEY!,
    api_secret: process.env.CLOUD_SECRET!,
    secure: true
});

/**
 * Creates a new user account
 * - Validates email uniqueness
 * - Hashes password via UserModel
 * - Generates verification token
 * - Sends verification email to user
 * 
 * @route POST /auth/signup
 * @body { email, password, name }
 * @returns Message prompting user to verify email
 */
export const createNewUser : RequestHandler = async(req, res) => {
    const { email, password, name } = req.body;

    // Check if user with this email already exists
    const existingUser = await UserModel.findOne({ email })
    if(existingUser) return sendErrorRes(res, 409, "User already exists");
    
    // Create new user document with email, password, and name
    const newUser = await UserModel.create({ email, password, name });

    // Generate a random 36-byte hex token for email verification
    const verificationToken = crypto.randomBytes(36).toString("hex");
    const authVerificationToken = new AuthVerificationTokenModel({ 
        owner: newUser._id, 
        token: verificationToken 
    });
    await authVerificationToken.save();
    
    // Build verification link with user ID and token
    const link = `${process.env.BASE_URL}${process.env.PORT}/verify.html?id=${newUser._id}&token=${verificationToken}`;

    // Send verification email with link
    await mail.sendVerification(link, newUser.email);

    res.json({ message: "Please check your email to verify your account" });
} 

/**
 * Verifies user email via token sent in registration email
 * - Validates token matches saved token
 * - Updates user verified status
 * - Deletes verification token after successful verification
 * 
 * @route POST /auth/verify
 * @body { id, token }
 * @returns Success message
 */
export const verifyUser : RequestHandler = async(req, res) => {
    const { id, token } = req.body;

    // Fetch saved verification token for this user
    const savedToken = await AuthVerificationTokenModel.findOne({ owner: id });
    if(!savedToken) return sendErrorRes(res, 400, "Invalid or expired token");

    // Compare provided token with hashed saved token
    const isValid = await savedToken.compareToken(token);
    if(!isValid) return sendErrorRes(res, 400, "Invalid or expired token");

    // Mark user as verified and delete the used verification token
    await UserModel.findByIdAndUpdate(id, { verified: true });
    await AuthVerificationTokenModel.findByIdAndDelete(savedToken._id);

    res.json({ message: "Account verified successfully" });
} 

/**
 * Authenticates user and issues JWT tokens
 * - Validates email and password
 * - Generates access token (15 min expiry) and refresh token
 * - Stores refresh token in user document for future validation
 * - Returns user profile and both tokens
 * 
 * @route POST /auth/signin
 * @body { email, password }
 * @returns User profile and access/refresh tokens
 */
export const signIn : RequestHandler = async(req, res) => {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await UserModel.findOne({ email });
    if(!user) return sendErrorRes(res, 404, "User not found");

    // Verify provided password against stored hashed password
    const isMatch = await user.comparePassword(password);
    if(!isMatch) return sendErrorRes(res, 401, "Invalid credentials");

    // Generate short-lived access token (15 minutes)
    const accessToken = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: "15m" }
    );

    // Generate long-lived refresh token (no expiry)
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string);

    // Store refresh token in user's token array for validation on future requests
    if(!user.tokens) user.tokens = [refreshToken]
    else user.tokens.push(refreshToken)

    await user.save();

    // Return user profile and both tokens
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

/**
 * Logs out user by removing refresh token from their token list
 * - Finds user with matching refresh token
 * - Removes the token from user's tokens array
 * - Prevents further use of that token
 * 
 * @route POST /auth/signout
 * @body { refreshToken, id }
 * @returns Empty response on success
 */
export const signOut : RequestHandler = async(req, res) => {
    const { refreshToken } = req.body;
    
    // Find user by ID and verify they have this refresh token stored
    const user = await UserModel.findOne({
        _id: req.user.id,
        tokens: refreshToken
    });

    if(!user) return sendErrorRes(res, 403, "Unauthorized request, user not found!");

    // Remove the provided refresh token from user's tokens array
    const newTokens = user.tokens.filter(t => t !== refreshToken);
    user.tokens = newTokens as [string];
    await user.save();

    res.send();
}

export const forgotPassword : RequestHandler = async(req, res) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if(!user) return sendErrorRes(res, 401, "Unauthorized request, user not found!");

    // remove previous password reset token (if any)
    await PasswordResetTokenModel.findOneAndDelete({ 
        owner: user._id as any 
    });

    // create new password reset token
    const passwordResetToken = crypto.randomBytes(36).toString("hex");
    await PasswordResetTokenModel.create({
        owner: user._id as any,
        token: passwordResetToken
    });

    // Send password reset link
    const passwordResetLink = `${process.env.BASE_URL}${process.env.PORT}/reset-password.html?id=${user._id}&token=${passwordResetToken}`;
    await mail.sendPasswordReset(passwordResetLink, user.email);

    res.json({ message: "Password reset link sent"})

}

export const updatePassword : RequestHandler = async(req, res) => {
    const { id, password } = req.body;

    const user = await UserModel.findById(id);
    if(!user) return sendErrorRes(res, 403, "User does not exist, unauthorized access");

    // ensure new password is not the same as the previous password
    const matched = await user.comparePassword(password);
    if(matched) return sendErrorRes(res, 422, "The new password must be different!");

    // update password and remove password reset token
    user.password = password; 
    await user.save();
    await PasswordResetTokenModel.findOneAndDelete({owner: user._id} as any);

    // send conformation email 
    await mail.sendPasswordUpdated(user.email);


    res.json({message: "Password successfully updated!"});
}

export const updateProfile : RequestHandler = async(req, res) => {
    const { name } = req.body;


    // TODO: make this accept any key and value pair
    if(typeof name !== 'string' || name.trim().length < 3){
        return sendErrorRes(res, 422, "Invalid name!");
    } 

    await UserModel.findByIdAndUpdate(req.user.id, { name })

    res.json({
        profile: { ...req.user, name}
    })
}

export const updateAvatar: RequestHandler = async(req, res) => { 
    const { avatar } = req.files;

    if(Array.isArray(avatar)) return sendErrorRes(res, 422, "Multiple files are not allowed");
    if(!avatar.mimetype?.startsWith("image")) return sendErrorRes(res, 422, "Invalid image file type!");

    const user = await UserModel.findById(req.user.id);
    if (!user) return sendErrorRes(res, 404, "user not found");

    if(user.avatar?.id){
        await cloudinary.uploader.destroy(user.avatar.id)
    }

    // upload avatar file
    const { secure_url: url, public_id: id } = await cloudinary.uploader.upload(
        avatar.filepath, {
            width: 300,
            height: 300,
            crop: "thumb",
            gravity: "face"
        });
    user.avatar = {url, id};
    await user.save();

    res.json({ profile: {...req.user, avatar: user.avatar.url }})
}

/**
 * Returns authenticated user's profile information
 * - Requires valid authentication middleware (req.user populated)
 * - Returns only the profile data already in request
 * 
 * @route GET /auth/profile
 * @returns User profile object
 */
export const sendProfile : RequestHandler = async(req, res) => {
    res.json({
        profile: req.user
    })
} 

export const sendPublicProfile : RequestHandler = async(req, res) => {
    const profileId = req.params.id;
    if(!isValidObjectId(profileId)) return sendErrorRes(res, 422, "Invalid profile id!");

    const user = await UserModel.findById(profileId);
    if(!user) return sendErrorRes(res, 404, "User not found");

    return res.json({
        profile: {
            id: user._id,
            name: user.name,
            avatar: user.avatar?.url
        }
    })
} 

/**
 * Generates new email verification token and resends verification email
 * - Deletes old verification token for this user
 * - Creates new verification token
 * - Sends new verification email
 * - Used when user wants to reverify or missed original email
 * 
 * @route POST /auth/generate-verification-link
 * @auth Required - uses req.user from auth middleware
 * @returns Message prompting user to check email
 */
export const generateVerificationLink : RequestHandler = async(req, res) => {
    const { id, email } = req.user;

    // Remove any existing verification token for this user
    await AuthVerificationTokenModel.findOneAndDelete( { owner : id });

    // Generate new 36-byte hex verification token
    const token = crypto.randomBytes(36).toString("hex");
    await AuthVerificationTokenModel.create({ owner: id, token});

    // Build verification link
    const link = `${process.env.BASE_URL}${process.env.PORT}/verify.html?id=${id}&token=${token}`;
    
    // Send verification email
    await mail.sendVerification(link, email);

    res.json({ message: "Please check your email to verify your account" });
}

/**
 * Refreshes expired access token using a valid refresh token
 * - Validates refresh token signature and existence in user's tokens
 * - Detects token compromise (refresh token in DB but user not found)
 * - Issues new access and refresh tokens
 * - Rotates refresh token for security (old token replaced with new one)
 * 
 * @route POST /auth/refresh
 * @body { refreshToken }
 * @returns New access and refresh tokens
 */
export const grantAccessToken : RequestHandler = async(req, res) => {
    const { refreshToken } = req.body;

    console.log(refreshToken)
    
    // Check that refresh token was provided
    if(!refreshToken) return sendErrorRes(res, 403, "Unauthorized request!")

    // Verify JWT signature and extract payload
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as { userId : string}
    if(!payload.userId) return sendErrorRes(res, 403, "Unauthorized request!");

    // Find user and verify they have this refresh token stored
    const user = await UserModel.findOne({
        _id: payload.userId,
        tokens: refreshToken
    })

    if(!user){
        // If token is in payload but not in user's tokens, account is compromised
        // Remove all tokens to force re-authentication
        await UserModel.findByIdAndUpdate(payload.userId, {tokens: []})
        return sendErrorRes(res, 401, "Unauthorized Request!")
    }

    // Generate new short-lived access token (15 minutes)
    const newAccessToken = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: "15m" }
    );

    // Generate new long-lived refresh token
    const newRefreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string);

    // Remove old refresh token and add new one (token rotation for security)
    const filteredTokens = user.tokens.filter((t) => t !== refreshToken)
    user.tokens = filteredTokens as [string]
    user.tokens.push(newRefreshToken)
    await user.save()

    // Return new tokens to client
    res.json({
        tokens: {refresh : newRefreshToken, access: newAccessToken}
    })
}

export const grantValid : RequestHandler = async(req, res) => {
    res.json({valid: true})
}