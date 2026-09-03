import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useSelector } from 'react-redux';
import { getAuthState } from '@/store/auth';

const Navigator: React.FC = () => {
    const authState = useSelector(getAuthState);
    console.log('authState:', authState);
	return (
		<NavigationContainer >
            {!authState ? <AuthNavigator /> : <AppNavigator />}
        </NavigationContainer>
    );
};

export default Navigator;
