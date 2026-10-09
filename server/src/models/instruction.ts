import {model, Schema} from "mongoose";
import { Status } from "src/models/punchTask";

interface Instruction {
    taskId: Schema.Types.ObjectId;
    title: string;
    note?: string;
    complete: boolean;
    status: Status;
}

const instructionSchema = new Schema<Instruction>({
    // back reference to the punch task, used to check ownership when updating a single instruction
    taskId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    note: {
        type: String,
    },
    complete: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: Object.values(Status),
        default: Status.STARTED,
    },
}, {
    timestamps: true
});

const InstructionModel = model("Instruction", instructionSchema);
export default InstructionModel;
