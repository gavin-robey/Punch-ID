import { runAxiosAsync } from '@/api/runAxiosAsync';
import useClient from '@/hooks/useClient';
import asyncStorage, { Keys } from '@/utils/asyncStorage';
import { Instruction, PunchStatus, PunchTask } from '@/types/punchTask';

type PunchTaskResponse = Omit<PunchTask, 'id'> & { _id: string };
type InstructionResponse = Omit<Instruction, 'id'> & { _id: string };

export type TaskUpdate = Partial<{ name: string; description: string; status: PunchStatus; dateDue: string }>;
export type InstructionUpdate = Partial<{ title: string; note: string; complete: boolean; status: PunchStatus }>;

const mapTask = (task: PunchTaskResponse): PunchTask => ({
    id: task._id,
    jobId: task.jobId,
    name: task.name,
    description: task.description,
    visibility: task.visibility,
    media: Array.isArray(task.media) ? task.media : [],
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
    status: task.status,
    notes: Array.isArray(task.notes) ? task.notes : [],
    dateDue: task.dateDue,
    punchId: task.punchId,
    instructions: Array.isArray(task.instructions) ? task.instructions : [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
});

const mapInstruction = (instruction: InstructionResponse): Instruction => ({
    id: instruction._id,
    taskId: instruction.taskId,
    title: instruction.title,
    note: instruction.note,
    complete: Boolean(instruction.complete),
    status: instruction.status,
    createdAt: instruction.createdAt,
    updatedAt: instruction.updatedAt,
});

const usePunchTasks = () => {
    const { authClient } = useClient();

    // tasks for a job, most recently updated first
    const fetchTasks = async (jobId: string) => {
        const accessToken = await asyncStorage.get(Keys.AUTH_TOKEN);
        const res = await runAxiosAsync<{ tasks: PunchTaskResponse[] }>(
            authClient.get(`job/get-tasks/${jobId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
        );

        if(res.error) return { tasks: null, error: res.error };
        return { tasks: (res.data?.tasks ?? []).map(mapTask), error: null };
    };

    const authHeaders = async () => ({
        headers: {
            Authorization: `Bearer ${await asyncStorage.get(Keys.AUTH_TOKEN)}`
        }
    });

    // a single task plus the job it belongs to
    const fetchTask = async (taskId: string) => {
        const res = await runAxiosAsync<{ task: PunchTaskResponse, job: { id: string, name: string } }>(
            authClient.get(`job/get-task/${taskId}`, await authHeaders())
        );

        if(res.error || !res.data) return { task: null, job: null, error: res.error ?? 'Punch item not found' };
        return { task: mapTask(res.data.task), job: res.data.job, error: null };
    };

    const updateTask = async (taskId: string, update: TaskUpdate) => {
        const res = await runAxiosAsync<{ task: PunchTaskResponse }>(
            authClient.patch(`job/update-task/${taskId}`, update, await authHeaders())
        );

        if(res.error || !res.data) return { task: null, error: res.error ?? 'Could not update punch item' };
        return { task: mapTask(res.data.task), error: null };
    };

    // instruction steps in the order stored on the task
    const fetchInstructions = async (taskId: string) => {
        const res = await runAxiosAsync<{ instructions: InstructionResponse[] }>(
            authClient.get(`job/get-instructions/${taskId}`, await authHeaders())
        );

        if(res.error) return { instructions: null, error: res.error };
        return { instructions: (res.data?.instructions ?? []).map(mapInstruction), error: null };
    };

    const createInstruction = async (taskId: string, step: { title: string; note?: string }) => {
        const res = await runAxiosAsync<{ instruction: InstructionResponse }>(
            authClient.post(`job/create-instruction/${taskId}`, step, await authHeaders())
        );

        if(res.error || !res.data) return { instruction: null, error: res.error ?? 'Could not add step' };
        return { instruction: mapInstruction(res.data.instruction), error: null };
    };

    const updateInstruction = async (instructionId: string, update: InstructionUpdate) => {
        const res = await runAxiosAsync<{ instruction: InstructionResponse }>(
            authClient.patch(`job/update-instruction/${instructionId}`, update, await authHeaders())
        );

        if(res.error || !res.data) return { instruction: null, error: res.error ?? 'Could not update step' };
        return { instruction: mapInstruction(res.data.instruction), error: null };
    };

    return { fetchTasks, fetchTask, updateTask, fetchInstructions, createInstruction, updateInstruction };
};

export default usePunchTasks;
