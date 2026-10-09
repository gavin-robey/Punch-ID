import {model, Schema, Types} from "mongoose";

export enum Status {
    STARTED = 'Open',
    INPROGRESS = "In progress",
    COMPLETE = "Complete",
    LATE = "Late"
}

export enum MediaKind {
    IMAGE = "image",
    VIDEO = "video"
}

export enum Visibility {
    PROJECT = "project",
    TEMPLATE = "template"
}

export interface MediaItem {
    url: string;
    id: string;
    kind: MediaKind;
}

export interface AttachmentItem {
    url: string;
    id: string;
    name: string;
    mimeType?: string;
}

interface PunchTask {
    jobId: Schema.Types.ObjectId;
    name: string;
    description?: string;
    visibility: Visibility;
    media: MediaItem[];
    attachments: AttachmentItem[];
    status: Status;
    notes: [string];
    dateDue: Date;
    punchId: string;
    instructions: Types.ObjectId[];
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
    visibility: {
        type: String,
        enum: Object.values(Visibility),
        default: Visibility.PROJECT,
    },
    // photos and videos from the camera roll
    media: {
        type: [{
            _id: false,
            url: { type: String, required: true },
            id: { type: String, required: true },
            kind: { type: String, enum: Object.values(MediaKind), required: true },
        }],
        default: [],
    },
    // any other uploaded files (pdfs, spec sheets, ...)
    attachments: {
        type: [{
            _id: false,
            url: { type: String, required: true },
            id: { type: String, required: true },
            name: { type: String, required: true },
            mimeType: { type: String },
        }],
        default: [],
    },
    status: {
        type: String,
        enum: Object.values(Status),
        default: Status.STARTED,
    },
    notes: {
        type: [String],
        default: [],
    },
    dateDue: {
        type: Date,
        required: true
    }, 
    punchId : {
        type: String,
        required: true,
    },
    // ordered list of instruction steps for this task
    instructions: {
        type: [Schema.Types.ObjectId],
        default: [],
    },
}, {
    timestamps: true
});

const PunchTaskModel = model("PunchTask", punchTaskSchema);
export default PunchTaskModel;