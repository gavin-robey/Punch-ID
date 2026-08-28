import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from './AuthNavigator';

const Navigator: React.FC = () => {
	return (
		<NavigationContainer >
            <AuthNavigator />
        </NavigationContainer>
    );
};

export default Navigator;
