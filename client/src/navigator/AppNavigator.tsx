import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from '@/views/Home';

export type AuthStackParamList = {
    SignIn : undefined,
    SignUp: undefined,
    ForgetPassword: undefined
}

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AppNavigator: React.FC = () => {
    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
            <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
    );
};

export default AppNavigator;