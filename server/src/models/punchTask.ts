import {model, Schema} from "mongoose";

export enum Status {
    STARTED = 'Open',
    INPROGRESS = "In progress",
    COMPLETE = "Complete",
    LATE = "Late"
}

export enum ContentType {
    MEDIA = "media",
    NOTES = "notes",
    ATTACHMENT = "attachment"
}

export enum Visibility {
    PROJECT = "project",
    TEMPLATE = "template"
}

interface PunchTask {
    jobId: Schema.Types.ObjectId;
    name: string;
    description?: string;
    contentType: ContentType;
    visibility: Visibility;
    media?: {
        url: string, 
        id: string 
    };
    status: Status;
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
    description: {
        type: String,
    },
    contentType: {
        type: String,
        enum: Object.values(ContentType),
        required: true,
    },
    visibility: {
        type: String,
        enum: Object.values(Visibility),
        default: Visibility.PROJECT,
    },
    media: {
        type: Object,
        url: String,
        id: String
    },
    status: {
        type: String,
        enum: Object.values(Status),
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