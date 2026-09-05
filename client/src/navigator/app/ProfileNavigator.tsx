import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Profile from '@/views/app/Profile';

export type ProfileStackParamList = {
    Profile : undefined
}

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
    return (
        <Stack.Navigator initialRouteName="Profile" screenOptions={{headerShown: false}}>
            <Stack.Screen name="Profile" component={Profile} />
        </Stack.Navigator>
    );
};

export default ProfileNavigator;