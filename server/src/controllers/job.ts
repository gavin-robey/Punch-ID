import { RequestHandler } from "express"
import { isValidObjectId } from "mongoose";
import JobModel from "src/models/job";
import PunchTaskModel, { AttachmentItem, MediaItem, MediaKind, Status } from "src/models/punchTask";
import InstructionModel from "src/models/instruction";
import UserModel from "src/models/user";
import { sendErrorRes } from "src/utils/helper";
import cloudinary from "src/utils/cloudinary";
import { parseJsonArray } from "src/validation/jobSchema";
import { File } from "formidable";

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

const MAX_FILES = 10;

// fileParser gives a single File for one upload and an array for several
const filesFor = (files: File | File[] | undefined) => !files ? [] : Array.isArray(files) ? files : [files];

// images are capped in size like avatars so large camera photos stay light
const uploadMedia = async (file: File): Promise<MediaItem> => {
    const isVideo = file.mimetype?.startsWith("video");
    const { secure_url: url, public_id: id } = await cloudinary.uploader.upload(
        file.filepath, isVideo ? {
            resource_type: "video"
        } : {
            width: 1920,
            height: 1920,
            crop: "limit"
        });
    return { url, id, kind: isVideo ? MediaKind.VIDEO : MediaKind.IMAGE };
}

const uploadAttachment = async (file: File): Promise<AttachmentItem> => {
    const { secure_url: url, public_id: id } = await cloudinary.uploader.upload(file.filepath, { resource_type: "auto" });
    return { url, id, name: file.originalFilename ?? "Attachment", mimeType: file.mimetype ?? undefined };
}

export const createTask : RequestHandler = async(req, res) => {
    try{
        const { id, name, dateDue, description, visibility, notes, instructions } = req.body;
        const punchId = req.params.id as string;

        if(!isValidObjectId(id)) return sendErrorRes(res, 422, "Invalid job id");

        const job = await JobModel.findOne({ _id: id, owner: req.user.id });
        if(!job) return sendErrorRes(res, 404, "Job not found");

        // every file is checked before anything is uploaded
        const mediaFiles = filesFor(req.files.media);
        const attachmentFiles = filesFor(req.files.attachments);
        if(mediaFiles.length > MAX_FILES || attachmentFiles.length > MAX_FILES) return sendErrorRes(res, 422, `Up to ${MAX_FILES} photos/videos and ${MAX_FILES} attachments are allowed`);
        if(mediaFiles.some((file) => !file.mimetype?.startsWith("image") && !file.mimetype?.startsWith("video"))) return sendErrorRes(res, 422, "Invalid photo or video file type!");

        const [media, attachments] = await Promise.all([
            Promise.all(mediaFiles.map(uploadMedia)),
            Promise.all(attachmentFiles.map(uploadAttachment)),
        ]);

        const task = await PunchTaskModel.create({
            jobId: job._id as any,
            name,
            description,
            visibility,
            media,
            attachments,
            notes: (parseJsonArray(notes) ?? []).map((note: string) => note.trim()),
            dateDue: new Date(dateDue),
            punchId
        });

        const steps = (parseJsonArray(instructions) ?? []) as { title: string, note?: string }[];
        if(steps.length){
            const created = await InstructionModel.insertMany(steps.map((step) => ({
                taskId: task._id as any,
                title: step.title.trim(),
                note: step.note?.trim() || undefined,
            })));
            task.instructions = created.map((instruction) => instruction._id);
            await task.save();
        }

        job.punchTasks.push(task._id);
        await job.save();

        res.json({
            message: "Successfully attached content to QR",
            task
        })
    }catch(err){
        return sendErrorRes(res, 500, `${err}`);
    }
}

// finds a punch task only if its job belongs to the user, null otherwise
const findOwnedTask = async (taskId: string, userId: Object) => {
    if(!isValidObjectId(taskId)) return null;

    const task = await PunchTaskModel.findById(taskId);
    if(!task) return null;

    const job = await JobModel.findOne({ _id: task.jobId, owner: userId });
    if(!job) return null;

    return { task, job };
}

export const getTask : RequestHandler = async(req, res) => {
    const owned = await findOwnedTask(req.params.id as string, req.user.id);
    if(!owned) return sendErrorRes(res, 404, "Punch item not found");

    res.json({
        task: owned.task,
        job: { id: owned.job._id, name: owned.job.name }
    });
}

export const updateTask : RequestHandler = async(req, res) => {
    const { name, description, status, dateDue } = req.body;

    const owned = await findOwnedTask(req.params.id as string, req.user.id);
    if(!owned) return sendErrorRes(res, 404, "Punch item not found");

    const { task } = owned;
    if(name !== undefined) task.name = name;
    if(description !== undefined) task.description = description;
    if(status !== undefined) task.status = status;
    if(dateDue !== undefined) task.dateDue = new Date(dateDue);
    await task.save();

    res.json({
        message: "Punch item updated",
        task
    });
}

export const getInstructions : RequestHandler = async(req, res) => {
    const owned = await findOwnedTask(req.params.taskId as string, req.user.id);
    if(!owned) return sendErrorRes(res, 404, "Punch item not found");

    // keep the order stored on the task
    const found = await InstructionModel.find({ _id: { $in: owned.task.instructions } });
    const instructions = owned.task.instructions
        .map((id) => found.find((instruction) => instruction._id.equals(id)))
        .filter(Boolean);

    res.json({
        instructions
    });
}

export const createInstruction : RequestHandler = async(req, res) => {
    const { title, note } = req.body;

    const owned = await findOwnedTask(req.params.taskId as string, req.user.id);
    if(!owned) return sendErrorRes(res, 404, "Punch item not found");

    const instruction = await InstructionModel.create({
        taskId: owned.task._id as any,
        title,
        note
    });

    owned.task.instructions.push(instruction._id);
    await owned.task.save();

    res.json({
        message: "Step added",
        instruction
    });
}

export const updateInstruction : RequestHandler = async(req, res) => {
    const { title, note, complete, status } = req.body;
    const instructionId = req.params.id as string;
    if(!isValidObjectId(instructionId)) return sendErrorRes(res, 422, "Invalid instruction id");

    const instruction = await InstructionModel.findById(instructionId);
    if(!instruction) return sendErrorRes(res, 404, "Step not found");

    const owned = await findOwnedTask(`${instruction.taskId}`, req.user.id);
    if(!owned) return sendErrorRes(res, 404, "Step not found");

    if(title !== undefined) instruction.title = title;
    if(note !== undefined) instruction.note = note;
    if(status !== undefined) instruction.status = status;

    // complete and status stay in sync: checking a step completes it, unchecking reopens it
    if(complete !== undefined){
        instruction.complete = complete;
        if(complete) instruction.status = Status.COMPLETE;
        else if(instruction.status === Status.COMPLETE) instruction.status = Status.STARTED;
    }else if(status !== undefined){
        instruction.complete = status === Status.COMPLETE;
    }
    await instruction.save();

    res.json({
        message: "Step updated",
        instruction
    });
}
