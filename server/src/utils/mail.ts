import Nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import * as dotenv from 'dotenv';

dotenv.config();

const transport = Nodemailer.createTransport(
    MailtrapTransport({
        token: process.env.MAILTRAP_TOKEN || "",
        sandbox: true,
        testInboxId: 4855078,
    })
);

const sendVerification = async(link: string, email : string) => {
    const sender = {
        address: "verification@punchid.com",
        name: "Account Verification",
    };

    await transport.sendMail({
        from: sender,
        to: email,
        subject: "Verify your account",
        html: `<h1>Verify your account</h1><a href='${link}'>Verify Email</a>`,
    })
}

const sendPasswordReset = async(link: string, email : string) => {
    const sender = {
        address: "Security@punchid.com",
        name: "Password Reset",
    };

    await transport.sendMail({
        from: sender,
        to: email,
        subject: "Reset your password",
        html: `<h1>Reset your password</h1><a href='${link}'>Reset Password</a>`,
    })
}

const sendPasswordUpdated = async(email : string) => {
    const sender = {
        address: "Security@punchid.com",
        name: "Password Successfully Updated!",
    };

    await transport.sendMail({
        from: sender,
        to: email,
        subject: "Your password has been updated",
        html: `<h1>Your password has been successfully updated! </h1>`,
    })
}

const mail = {
    sendVerification,
    sendPasswordReset,
    sendPasswordUpdated
}

export default mail;