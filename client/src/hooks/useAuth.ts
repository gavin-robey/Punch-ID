import client from "@/api/client";
import { runAxiosAsync } from "@/api/runAxiosAsync";
import { updateAuthState } from "@/store/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { ShowErrorToast } from "../../components/ErrorToast";

export type UserInfo = {
    email: string;  
    password: string;
}

export type SignInRes = {
    profile: {
        id: string;
        email: string;
        name: string;
        verified: boolean
    };
    tokens: {
        refresh: string;
        access: string;
    }
}

export type ToastInfo = Omit<ShowErrorToast, "description">;

const useAuth = () => {
    const dispatch = useDispatch();

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
            await AsyncStorage.setItem('access-token', res.data.tokens.access);
            await AsyncStorage.setItem('refresh-token', res.data.tokens.refresh);
            dispatch(updateAuthState({ profile: res.data.profile, pending: false }));
        }else{
            if(res.error.toLowerCase().includes("email") || res.error.toLowerCase().includes("user")) setEmailInvalid(true);
            if(res.error.toLowerCase().includes("password") || res.error.toLowerCase().includes("credentials")) setPasswordInvalid(true);
            showErrorToast({ ...toastInfo, description: res.error });   
            dispatch(updateAuthState({ profile: null, pending: false }));
        }
    }

    return { signIn }
};

export default useAuth;