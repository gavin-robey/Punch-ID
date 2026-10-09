import client from "@/api/client";
import { runAxiosAsync } from "@/api/runAxiosAsync";
import { updateAuthState } from "@/store/auth";
import { updateCurrentJob, updateJobState } from "@/store/jobs";
import useClient from "@/hooks/useClient";
import { useDispatch } from "react-redux";
import { ShowErrorToast } from "../../components/ErrorToast";
import asyncStorage, { Keys } from "@/utils/asyncStorage";

export type UserInfo = {
    email: string;  
    password: string;
}

export type SignInRes = {
    profile: {
        id: string;
        email: string;
        name: string;
        verified: boolean;
        avatar?: string;
    };
    tokens: {
        refresh: string;
        access: string;
    }
}

export type ToastInfo = Omit<ShowErrorToast, "description">;

const useAuth = () => {
    const dispatch = useDispatch();
    const { authClient } = useClient();

    const signIn = async (
        userInfo: UserInfo, 
        setEmailInvalid: (invalid: boolean) => void, 
        setPasswordInvalid: (invalid: boolean) => void,
        showErrorToast: (toastConfig: ShowErrorToast) => void,
        toastInfo: ToastInfo
    ) => {
        dispatch(updateAuthState({ profile: null, pending: true }));
        const res = await runAxiosAsync<SignInRes>(client.post('auth/sign-in', userInfo));

        await new Promise((resolve) => setTimeout(resolve, 500));
        if(res.data){
            await asyncStorage.save(Keys.AUTH_TOKEN, res.data.tokens.access);
            await asyncStorage.save(Keys.REFRESH_TOKEN, res.data.tokens.refresh);
            dispatch(updateAuthState({ profile: {...res.data.profile, accessToken: res.data.tokens.access}, pending: false }));
        }else{
            if(res.error.toLowerCase().includes("email") || res.error.toLowerCase().includes("user")) setEmailInvalid(true);
            if(res.error.toLowerCase().includes("password") || res.error.toLowerCase().includes("credentials")) setPasswordInvalid(true);
            showErrorToast({ ...toastInfo, description: res.error });   
            dispatch(updateAuthState({ profile: null, pending: false }));
        }
    }

    // revokes the refresh token on the server, then clears everything stored locally for this user
    const signOut = async () => {
        const accessToken = await asyncStorage.get(Keys.AUTH_TOKEN);
        const refreshToken = await asyncStorage.get(Keys.REFRESH_TOKEN);

        // local sign out still happens if this fails (e.g. expired session), so the error is only returned
        const res = await runAxiosAsync(
            authClient.post('auth/sign-out', { refreshToken }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
        );

        await asyncStorage.remove(Keys.AUTH_TOKEN);
        await asyncStorage.remove(Keys.REFRESH_TOKEN);
        await asyncStorage.remove(Keys.CURRENT_JOB);
        dispatch(updateJobState({ jobs: null, pending: false }));
        dispatch(updateCurrentJob(null));
        dispatch(updateAuthState({ profile: null, pending: false }));

        return { error: res.error };
    }

    return { signIn, signOut }
};

export default useAuth;