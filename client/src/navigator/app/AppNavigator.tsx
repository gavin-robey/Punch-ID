import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from '@/views/app/Home';
import AddPunchItem from '@/views/app/AddPunchItem';
import PunchItem from '@/views/app/PunchItem'

export type AppStackParamList = {
    Home : undefined,
    AddPunchItem: undefined,
    PunchItem: { id: string; },
}

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator: React.FC = () => {
    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="AddPunchItem" component={AddPunchItem}/>
            <Stack.Screen name="PunchItem" component={PunchItem} />
        </Stack.Navigator>
    );
};

export default AppNavigator;