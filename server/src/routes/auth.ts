import { Router } from "express";
import { createNewUser } from "controllers/auth";

const authRouter = Router();

authRouter.post("/sign-up", createNewUser);
authRouter.get("/verify", (req, res) => {
    const { id, token } = req.query;    
    return res.send(`<h1>Verification Successful</h1><p>Your account has been verified. You can now log in.</p> <p>id: ${id}</p><p>token: ${token}</p>`);
});

export default authRouter;