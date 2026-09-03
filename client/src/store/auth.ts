import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';
import { createSelector } from 'reselect';

interface Profile {
    id: string;
    email: string;
    name: string;
    verified: boolean;
}

interface AuthState {
    profile: null | Profile;
    pending: boolean;
}

const initialState: AuthState = {
    profile: null,
    pending: false
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        updateAuthState(state, { payload } : PayloadAction<AuthState>) {
            state.pending = payload.pending;
            state.profile = payload.profile;
        }
    } 
});

export const getAuthState = createSelector((state: RootState) => state.auth, (authState) => authState)
export const { updateAuthState } = authSlice.actions;
export default authSlice.reducer;