import { RequestHandler } from "express";
import UserModel from "src/models/user";

export const createNewUser : RequestHandler = async(req, res) => {
    const { email, password, name } = req.body;

    if (!email) return res.status(422).json({ message: "Missing email" });
    if (!password) return res.status(422).json({ message: "Missing password" });
    if (!name) return res.status(422).json({ message: "Missing name" });

    const existingUser = await UserModel.findOne({ email })
    if(existingUser) return res.status(409).json({ message: "User already exists" });

    
    const newUser = new UserModel({ email, password, name });
    await newUser.save();


    res.status(200).json({ message: "User signed up successfully" });
}