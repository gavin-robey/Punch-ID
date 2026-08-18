import { Router } from "express";
import { createNewUser, generateVerificationLink, grantAccessToken, sendProfile, signIn, signOut, verifyUser, forgotPassword, grantValid, updatePassword, updateProfile } from "controllers/auth";
import validate from "src/middleware/validator";
import { newUserSchema, resetPasswordSchema, signInSchema, verifyTokenSchema } from "src/validation/authSchema";
import { isAuth, isValidPassResetToken } from "src/middleware/auth";

const authRouter = Router();

// User account routes
authRouter.post("/sign-up", validate(newUserSchema), createNewUser);
authRouter.post("/sign-in", validate(signInSchema), signIn);
authRouter.post("/sign-out", isAuth, signOut);
authRouter.patch("/update-profile", isAuth, updateProfile);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-pass", validate(resetPasswordSchema), updatePassword)

// verification routes
authRouter.post("/verify-user", validate(verifyTokenSchema), verifyUser);
authRouter.post("/verify-pass-reset-token", validate(verifyTokenSchema), isValidPassResetToken, grantValid);

// grants new access token given a refresh token
authRouter.post("/grant-access-token", grantAccessToken)

// generates and sends a new email / verification token
authRouter.get('/generate-new-verification', isAuth, generateVerificationLink);

// gets the user profile information
authRouter.get("/get-profile", isAuth, sendProfile);

export default authRouter;