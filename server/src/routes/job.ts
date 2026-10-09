import { Router } from "express";
import { createJob, createTask, getJobs, getTasks, getTask, updateTask, getInstructions, createInstruction, updateInstruction } from "src/controllers/job";
import { isAuth } from "src/middleware/auth";
import { fileParser } from "src/middleware/fileParser";
import validate from "src/middleware/validator";
import { newInstructionSchema, newJobSchema, newTaskSchema, updateInstructionSchema, updateTaskSchema } from "src/validation/jobSchema";

const jobRouter = Router();

jobRouter.post("/create-job", isAuth, validate(newJobSchema), createJob);
jobRouter.get('/get-jobs', isAuth, getJobs);
jobRouter.get('/get-tasks/:id', isAuth, getTasks);
jobRouter.post("/create-task/:id", isAuth, fileParser, validate(newTaskSchema), createTask);
jobRouter.get('/get-task/:id', isAuth, getTask);
jobRouter.patch('/update-task/:id', isAuth, validate(updateTaskSchema), updateTask);
jobRouter.get('/get-instructions/:taskId', isAuth, getInstructions);
jobRouter.post('/create-instruction/:taskId', isAuth, validate(newInstructionSchema), createInstruction);
jobRouter.patch('/update-instruction/:id', isAuth, validate(updateInstructionSchema), updateInstruction);


export default jobRouter;