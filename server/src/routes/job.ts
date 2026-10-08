import { Router } from "express";
import { createJob, createTask, getJobs } from "src/controllers/job";
import { isAuth } from "src/middleware/auth";
import validate from "src/middleware/validator";
import { newJobSchema, newTaskSchema } from "src/validation/jobSchema";

const jobRouter = Router();

jobRouter.post("/create-job", isAuth, validate(newJobSchema), createJob);
jobRouter.get('/get-jobs', isAuth, getJobs);
jobRouter.post("/create-task/:id", isAuth, validate(newTaskSchema), createTask);


export default jobRouter;