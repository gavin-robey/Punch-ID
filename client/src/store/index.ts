import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './auth';
import jobsReducer from './jobs';

const reducers = combineReducers({
    auth: authReducer,
    jobs: jobsReducer
});

const store = configureStore({ reducer: reducers });

export type RootState = ReturnType<typeof store.getState>;
export default store;