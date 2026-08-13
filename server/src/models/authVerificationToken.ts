import { Model, model, Schema } from "mongoose";
import {hash, compare, genSalt } from "bcrypt";

interface TokenDocument {
    owner: Schema.Types.ObjectId;
    token: string;
    createdAt: Date;   
}

interface TokenMethods {
    compareToken(token: string): Promise<boolean>;
}


const verificationTokenSchema = new Schema<TokenDocument, Model<TokenDocument, any, TokenMethods>, TokenMethods>({
    owner : {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token : {
        type: String,
        required: true
    },
    createdAt : {
        type: Date,
        expires: 1200, // 20 minutes
        default: Date.now()
    }
}, {
    timestamps: true
});

verificationTokenSchema.pre("save", async function() {
    if (this.isModified("token")) {
        const salt = await genSalt(10);
        this.token = await hash(this.token, salt);
    }
});

verificationTokenSchema.methods.compareToken = async function(token) {
    return await compare(token, this.token);
};

const AuthVerificationTokenModel = model("VerificationToken", verificationTokenSchema);
export default AuthVerificationTokenModel;