import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PunchItems from '@/views/app/PunchItems';

export type AppStackParamList = {
    PunchItems : undefined
}

const Stack = createNativeStackNavigator<AppStackParamList>();

const PunchNavigator: React.FC = () => {
    return (
        <Stack.Navigator initialRouteName="PunchItems" screenOptions={{headerShown: false}}>
            <Stack.Screen name="PunchItems" component={PunchItems} />
        </Stack.Navigator>
    );
};

export default PunchNavigator;