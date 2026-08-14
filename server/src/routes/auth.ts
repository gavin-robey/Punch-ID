import { Router } from "express";
import { createNewUser, sendProfile, signIn, verifyUser } from "controllers/auth";
import validate from "src/middleware/validator";
import { newUserSchema, signInSchema, verifyUserSchema } from "src/validation/authSchema";
import { isAuth } from "src/middleware/auth";

const authRouter = Router();

//routes
authRouter.post("/sign-up", validate(newUserSchema), createNewUser);
authRouter.post("/verify", validate(verifyUserSchema), verifyUser);
authRouter.post("/sign-in", validate(signInSchema), signIn);
authRouter.get("/profile", isAuth, sendProfile)

export default authRouter;