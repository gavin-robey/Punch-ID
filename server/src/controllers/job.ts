import { RequestHandler } from "express"
import JobModel from "src/models/job";
import PunchTaskModel from "src/models/punchTask";
import UserModel from "src/models/user";
import { sendErrorRes } from "src/utils/helper";

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
        message: "Successfully created new job"
    });
}

export const getJobs : RequestHandler = async(req, res) => {
    const userId = req.user.id;

    const jobs = await JobModel.find({ owner: userId });

    res.json({
        jobs
    });
}

export const createTask : RequestHandler = async(req, res) => {
    try{
        const { id, name, dateDue } = req.body;
        const punchId = req.params.id as string;

        const job = await JobModel.findById(id);
        if(!job) return sendErrorRes(res, 401, "Invalid job type");

        const date =  new Date(dateDue);
        const task = await PunchTaskModel.create({
            jobId: job._id as any,
            name,
            dateDue: date,
            punchId
        });

        job.punchTasks.push(task._id);
        await job.save();


        res.json({
            id,
            name,
            date,
            punchId
        })
    }catch(err){
        return sendErrorRes(res, 500, `${err}`);
    }
}