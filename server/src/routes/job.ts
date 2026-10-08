import { Router } from "express";
import { createJob, createTask, getJobs, getTasks } from "src/controllers/job";
import { isAuth } from "src/middleware/auth";
import { fileParser } from "src/middleware/fileParser";
import validate from "src/middleware/validator";
import { newJobSchema, newTaskSchema } from "src/validation/jobSchema";

const jobRouter = Router();

jobRouter.post("/create-job", isAuth, validate(newJobSchema), createJob);
jobRouter.get('/get-jobs', isAuth, getJobs);
jobRouter.get('/get-tasks/:id', isAuth, getTasks);
jobRouter.post("/create-task/:id", isAuth, fileParser, validate(newTaskSchema), createTask);


export default jobRouter;