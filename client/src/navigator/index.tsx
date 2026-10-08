import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from './auth/AuthNavigator';
import { useDispatch, useSelector } from 'react-redux';
import { getAuthState, Profile, updateAuthState } from '@/store/auth';
import React, { useEffect } from 'react';
import { runAxiosAsync } from "@/api/runAxiosAsync";
import LoadingSpinner from "../../components/LoadingSpinner";
import TabNavigator from "./TabNavigator";
import useClient from "@/hooks/useClient";
import asyncStorage, { Keys } from "@/utils/asyncStorage";

const Navigator: React.FC = () => {
    const authState = useSelector(getAuthState);
    const dispatch = useDispatch();
    const loggedIn = authState.profile ? true : false;
    const {authClient} = useClient();

    const fetchAuthState = async () => {
        const accessToken = await asyncStorage.get(Keys.AUTH_TOKEN);
        if(accessToken) { 
            dispatch(updateAuthState({ pending: true, profile: null }))
            const res = await runAxiosAsync<{profile: Profile}>(
                authClient.get('auth/get-profile', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })
            );

            if(res){
                dispatch(updateAuthState({ pending: false, profile: res.data?.profile || null }))
            }else{
                dispatch(updateAuthState({ pending: false, profile: null }))
            }
        }
    };

    useEffect(() => {
        fetchAuthState();
    }, []);
    
	return (
		<NavigationContainer >
            {authState.pending && <LoadingSpinner />}
            {!loggedIn ? <AuthNavigator /> : <TabNavigator />}
        </NavigationContainer>
    );
};

export default Navigator;
