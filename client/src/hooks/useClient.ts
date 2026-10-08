import axios, { create } from 'axios';
import { baseURL } from '@/api/client';
import { useDispatch, useSelector } from 'react-redux';
import { getAuthState, updateAuthState } from '@/store/auth';
// eslint-disable-next-line import/no-named-as-default
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import asyncStorage, { Keys } from '@/utils/asyncStorage';
import { runAxiosAsync } from '@/api/runAxiosAsync';

const authClient = create({baseURL})

type Response = {
    tokens: {
        refresh: string;
        access: string;
    }
}

const useClient = () => {
    const authState = useSelector(getAuthState);
    const accessToken = authState.profile?.accessToken;
    const dispatch = useDispatch();

    authClient.interceptors.request.use((config) => {
        if(!config.headers.Authorization){
            config.headers.Authorization = "Bearer " + accessToken;
        }
        return config;
    }, (error) => {
        return Promise.reject(error);
    });

    const refreshAuthLogic = async(failedRequest: any) => {
        const refreshToken = await asyncStorage.get(Keys.REFRESH_TOKEN);

        const {data} = await runAxiosAsync<Response>(axios({
            method: "POST",
            data: {refreshToken},
            url: `${baseURL}/auth/grant-access-token`
        }))

        if(data?.tokens){
            failedRequest.response.config.headers.Authorization = "Bearer " + data.tokens.access;
            await asyncStorage.save(Keys.AUTH_TOKEN, data.tokens.access);
            await asyncStorage.save(Keys.REFRESH_TOKEN, data.tokens.refresh);
            dispatch(updateAuthState({profile: {...authState.profile!, accessToken: data.tokens.access}, pending: false}));
            
            return Promise.resolve();
        }
    }

    createAuthRefreshInterceptor(authClient, refreshAuthLogic);

    return { authClient }
}

export default useClient;