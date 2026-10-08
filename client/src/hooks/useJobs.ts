import { useDispatch, useSelector } from 'react-redux';
import { runAxiosAsync } from '@/api/runAxiosAsync';
import useClient from '@/hooks/useClient';
import asyncStorage, { Keys } from '@/utils/asyncStorage';
import { getJobsState, Jobs, updateCurrentJob, updateJobState } from '@/store/jobs';

type JobResponse = {
    _id: string;
    name: string;
    owner: string;
    punchTasks: string[];
    createdAt: string;
    updatedAt: string;
};

const mapJob = (job: JobResponse): Jobs => ({
    id: job._id,
    name: job.name,
    owner: job.owner,
    punchTasks: Array.isArray(job.punchTasks) ? job.punchTasks : [],
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
});

const useJobs = () => {
    const { authClient } = useClient();
    const jobState = useSelector(getJobsState);
    const dispatch = useDispatch();

    const selectJob = async (job: Jobs | null) => {
        dispatch(updateCurrentJob(job));
        if(job) await asyncStorage.save(Keys.CURRENT_JOB, job.id);
        else await asyncStorage.remove(Keys.CURRENT_JOB);
    };

    // loads all jobs for the user and restores the last selected job
    const fetchJobs = async () => {
        dispatch(updateJobState({ pending: true, jobs: jobState.jobs }));

        const accessToken = await asyncStorage.get(Keys.AUTH_TOKEN);
        const res = await runAxiosAsync<{ jobs: JobResponse[] }>(
            authClient.get('job/get-jobs', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
        );

        if(res.error){
            dispatch(updateJobState({ pending: false, jobs: jobState.jobs }));
            return { error: res.error };
        }

        const jobs = (res.data?.jobs ?? []).map(mapJob);
        dispatch(updateJobState({ pending: false, jobs }));

        const currentJobId = jobState.currentJob?.id ?? await asyncStorage.get(Keys.CURRENT_JOB);
        dispatch(updateCurrentJob(jobs.find((job) => job.id === currentJobId) ?? null));

        return { error: null };
    };

    // creates a job, adds it to the list and makes it the current job
    const createJob = async (name: string) => {
        const accessToken = await asyncStorage.get(Keys.AUTH_TOKEN);
        const res = await runAxiosAsync<{ message: string, job: JobResponse }>(
            authClient.post('job/create-job', { name }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
        );

        if(res.error) return { error: res.error, message: null };

        if(res.data?.job){
            const job = mapJob(res.data.job);
            dispatch(updateJobState({ pending: false, jobs: [...(jobState.jobs ?? []), job] }));
            await selectJob(job);
        }

        return { error: null, message: res.data?.message ?? null };
    };

    return { ...jobState, fetchJobs, createJob, selectJob };
};

export default useJobs;
