import {model, Schema, Types} from "mongoose";

interface Job {
    owner: Schema.Types.ObjectId;
    publicId: string;
    name: string;
    punchTasks: [Types.ObjectId];
}

const jobSchema = new Schema<Job>({
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    name : {
        type: String,
        required: true
    },
    punchTasks: [Schema.Types.ObjectId]
}, {
    timestamps: true
});

const JobModel = model("Job", jobSchema);
export default JobModel;