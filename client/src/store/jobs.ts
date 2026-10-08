import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';
import { createSelector } from 'reselect';

export interface Jobs {
    id: string;
    name: string;
    owner: string;
    punchTasks: string[];
    createdAt: string;
    updatedAt: string;
}

interface JobState {
    jobs: null | Jobs[];
    currentJob: null | Jobs;
    pending: boolean;
}

const initialState: JobState = {
    jobs: null,
    currentJob: null,
    pending: false
};

const jobSlice = createSlice({
    name: 'jobs',
    initialState,
    reducers: {
        updateJobState(state, { payload } : PayloadAction<Pick<JobState, 'jobs' | 'pending'>>) {
            state.pending = payload.pending;
            state.jobs = payload.jobs;
        },
        updateCurrentJob(state, { payload } : PayloadAction<Jobs | null>) {
            state.currentJob = payload;
        }
    } 
});

export const getJobsState = createSelector((state: RootState) => state.jobs, (jobState) => jobState)
export const { updateJobState, updateCurrentJob } = jobSlice.actions;
export default jobSlice.reducer;
