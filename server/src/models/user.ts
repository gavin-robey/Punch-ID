import {model, Schema, Document, Model} from "mongoose";
import {hash, compare, genSalt } from "bcrypt";

interface User {
    email: string;
    password: string;
    name: string;
    verified: boolean;
    tokens: [string];
}

interface Methods {
    comparePassword(password: string): Promise<boolean>;
}


const userSchema = new Schema<User, Model<User, any, Methods>, Methods>({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    verified: {
        type: Boolean,
        default: false
    },
    tokens: [String]
}, {
    timestamps: true
});

// password hashing
userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        const salt = await genSalt(10);
        this.password = await hash(this.password, salt);
    }
});

userSchema.methods.comparePassword = async function (password: string) {
    return await compare(password, this.password);
};

const UserModel = model("User", userSchema);
export default UserModel;