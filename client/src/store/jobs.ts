import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';
import { createSelector } from 'reselect';

export interface Jobs {
    id: string;
    name: string;
    owner: string;
    punchTasks: [string];
    createdAt: string;
    updatedAt: string;
}

interface JobState {
    jobs: null | [Jobs];
    pending: boolean;
}

const initialState: JobState = {
    jobs: null,
    pending: false
};

const jobSlice = createSlice({
    name: 'jobs',
    initialState,
    reducers: {
        updateJobState(state, { payload } : PayloadAction<JobState>) {
            state.pending = payload.pending;
            state.jobs = payload.jobs;
        }
    } 
});

export const getJobsState = createSelector((state: RootState) => state.jobs, (jobState) => jobState)
export const { updateJobState } = jobSlice.actions;
export default jobSlice.reducer;