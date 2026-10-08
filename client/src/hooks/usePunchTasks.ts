import { runAxiosAsync } from '@/api/runAxiosAsync';
import useClient from '@/hooks/useClient';
import asyncStorage, { Keys } from '@/utils/asyncStorage';
import { PunchTask } from '@/types/punchTask';

type PunchTaskResponse = Omit<PunchTask, 'id'> & { _id: string };

const mapTask = (task: PunchTaskResponse): PunchTask => ({
    id: task._id,
    jobId: task.jobId,
    name: task.name,
    description: task.description,
    contentType: task.contentType,
    visibility: task.visibility,
    media: task.media,
    status: task.status,
    notes: Array.isArray(task.notes) ? task.notes : [],
    dateDue: task.dateDue,
    punchId: task.punchId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
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

    return { fetchTasks };
};

export default usePunchTasks;
