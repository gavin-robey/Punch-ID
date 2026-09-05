import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from './auth/AuthNavigator';
import { useDispatch, useSelector } from 'react-redux';
import { getAuthState, Profile, updateAuthState } from '@/store/auth';
import React, { useEffect } from 'react';
import client from '@/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runAxiosAsync } from "@/api/runAxiosAsync";
import LoadingSpinner from "../../components/LoadingSpinner";
import TabNavigator from "./TabNavigator";

const Navigator: React.FC = () => {
    const authState = useSelector(getAuthState);
    const dispatch = useDispatch();
    const loggedIn = authState.profile ? true : false;

    const fetchAuthState = async () => {
        const accessToken = await AsyncStorage.getItem('access-token');
        if(accessToken) { 
            dispatch(updateAuthState({ pending: true, profile: null }))
            const res = await runAxiosAsync<{profile: Profile}>(
                client.get('auth/get-profile', {
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
