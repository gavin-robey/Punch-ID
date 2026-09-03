import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

const Navigator: React.FC = () => {
    const loggedIn = false;
	return (
		<NavigationContainer >
            {!loggedIn ? <AuthNavigator /> : <AppNavigator />}
        </NavigationContainer>
    );
};

export default Navigator;
