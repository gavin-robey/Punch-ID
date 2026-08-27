import {model, Schema} from "mongoose";

export enum Status {
    STARTED,
    INPROGRESS,
    COMPLETE,
    LATE
}

interface PunchTask {
    jobId: Schema.Types.ObjectId;
    name: string;
    media?: {
        url: string, 
        id: string 
    };
    status: String;
    notes: [string];
    dateDue: Date;
    punchId: string;
}

const punchTaskSchema = new Schema<PunchTask>({
    jobId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    media: {
        type: Object,
        url: String,
        id: String
    },
    status: {
        type: String,
        enum: Status,
        default: Status.STARTED,
    },
    notes: {
        type: [String],
    },
    dateDue: {
        type: Date,
        required: true
    }, 
    punchId : {
        type: String,
        required: true,
    },
}, {
    timestamps: true
});

const PunchTaskModel = model("PunchTask", punchTaskSchema);
export default PunchTaskModel;