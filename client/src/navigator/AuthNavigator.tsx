import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignUp from '@/views/SignUp'
import ForgetPassword from '@/views/ForgotPassword';
import SignIn from '@/views/SignIn';


export type AuthStackParamList = {
    SignIn : undefined,
    SignUp: undefined,
    ForgetPassword: undefined
}

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
	return (
        <Stack.Navigator initialRouteName="SignIn"screenOptions={{headerShown: false}}>
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        </Stack.Navigator>
    );
};

export default AuthNavigator;
