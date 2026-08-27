import { RequestHandler } from "express"
import JobModel from "src/models/job";
import PunchTaskModel from "src/models/punchTask";
import { sendErrorRes } from "src/utils/helper";

export const createJob : RequestHandler = async(req, res) => {
    const { name } = req.body;

    // create job object 
    await JobModel.create({ 
        owner: req.user.id,
        name,
        punchTasks: []
    });

    res.json({
        message: "Successfully created new job"
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