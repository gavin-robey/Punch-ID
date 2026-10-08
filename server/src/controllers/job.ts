import { RequestHandler } from "express"
import { isValidObjectId } from "mongoose";
import JobModel from "src/models/job";
import PunchTaskModel, { ContentType } from "src/models/punchTask";
import UserModel from "src/models/user";
import { sendErrorRes } from "src/utils/helper";
import cloudinary from "src/utils/cloudinary";

export const createJob : RequestHandler = async(req, res) => {
    const { name } = req.body;
    const userId = req.user.id;

    // create job object 
    const job = await JobModel.create({ 
        owner: userId,
        name,
        punchTasks: []
    });

    const user = await UserModel.findById(userId);
    if(!user) return sendErrorRes(res, 401, "User does not exist");

    user.jobs.push(job._id)
    await user.save();

    res.json({
        message: "Successfully created new job",
        job
    });
}

export const getJobs : RequestHandler = async(req, res) => {
    const userId = req.user.id;

    const jobs = await JobModel.find({ owner: userId });

    res.json({
        jobs
    });
}

export const getTasks : RequestHandler = async(req, res) => {
    const jobId = req.params.id as string;
    if(!isValidObjectId(jobId)) return sendErrorRes(res, 422, "Invalid job id");

    const job = await JobModel.findOne({ _id: jobId, owner: req.user.id });
    if(!job) return sendErrorRes(res, 404, "Job not found");

    const tasks = await PunchTaskModel.find({ jobId: job._id as any }).sort({ updatedAt: -1 });

    res.json({
        tasks
    });
}

export const createTask : RequestHandler = async(req, res) => {
    try{
        const { id, name, dateDue, description, contentType, visibility, notes } = req.body;
        const punchId = req.params.id as string;

        if(!isValidObjectId(id)) return sendErrorRes(res, 422, "Invalid job id");

        const job = await JobModel.findOne({ _id: id, owner: req.user.id });
        if(!job) return sendErrorRes(res, 404, "Job not found");

        // photo/video and attachment content must come with a file, notes are text only
        let media;
        if(contentType !== ContentType.NOTES){
            const { file } = req.files;
            if(!file) return sendErrorRes(res, 422, "File is required");
            if(Array.isArray(file)) return sendErrorRes(res, 422, "Multiple files are not allowed");

            const isImage = file.mimetype?.startsWith("image");
            const isVideo = file.mimetype?.startsWith("video");
            if(contentType === ContentType.MEDIA && !isImage && !isVideo) return sendErrorRes(res, 422, "Invalid photo or video file type!");

            // upload file, images are capped in size like avatars so large camera photos stay light
            const { secure_url: url, public_id: id } = await cloudinary.uploader.upload(
                file.filepath, isImage ? {
                    width: 1920,
                    height: 1920,
                    crop: "limit"
                } : {
                    resource_type: isVideo ? "video" : "auto"
                });
            media = { url, id };
        }

        const task = await PunchTaskModel.create({
            jobId: job._id as any,
            name,
            description,
            contentType,
            visibility,
            media,
            notes: notes ? [notes] : [],
            dateDue: new Date(dateDue),
            punchId
        });

        job.punchTasks.push(task._id);
        await job.save();

        res.json({
            message: "Successfully attached content to QR",
            task,
            link: task.media?.url ?? null
        })
    }catch(err){
        return sendErrorRes(res, 500, `${err}`);
    }
}
