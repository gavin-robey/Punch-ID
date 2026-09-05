import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from '@/views/app/Home';

export type AppStackParamList = {
    Home : undefined
}

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator: React.FC = () => {
    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
            <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
    );
};

export default AppNavigator;