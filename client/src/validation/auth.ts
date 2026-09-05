import * as yup from "yup";

declare module "yup" {
    interface StringSchema {
        password(message?: string): this;
        email(message?: string): this;
    }
}

yup.addMethod(yup.string, "email", function (this: yup.StringSchema, message: string) {
    return this.matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
        message,
        name: "email",
        excludedEmptyString: true,
    });
});

yup.addMethod(yup.string, "password", function (this: yup.StringSchema, message: string) {
    return this.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message,
        name: "password",
        excludedEmptyString: true,
    });
});

export const newUserSchema = yup.object({
    email: yup
        .string()
        .email("Email must be a valid email address")
        .required("Email is required"),
    password: yup
        .string()
        .min(8, "Password must be at least 8 characters long")
        .password("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character")
        .required("Password is required"),
    name: yup.string().required("Name is required"),
    confirmPassword: yup
        .string()
        .min(8, "Password must be at least 8 characters long")
        .password("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character")
        .oneOf([yup.ref("password")], "Passwords must match")
        .required("Password is required"),
});

export const signInSchema = yup.object({
    email: yup
        .string()
        .email("Email must be a valid email address")
        .required("Email is required"),
    password: yup
        .string()
        .required("Password is required")
});

export const emailSchema = yup.object({
    email: yup
        .string()
        .email("Email must be a valid email address")
        .required("Email is required")
});