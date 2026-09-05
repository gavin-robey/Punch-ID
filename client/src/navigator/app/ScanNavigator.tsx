import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Scan from '@/views/app/Scan';

export type AppStackParamList = {
    Scan : undefined
}

const Stack = createNativeStackNavigator<AppStackParamList>();

const ScanNavigator: React.FC = () => {
    return (
        <Stack.Navigator initialRouteName="Scan" screenOptions={{headerShown: false}}>
            <Stack.Screen name="Scan" component={Scan} />
        </Stack.Navigator>
    );
};

export default ScanNavigator;