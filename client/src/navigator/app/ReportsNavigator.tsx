import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Reports from '@/views/app/Reports';

export type AppStackParamList = {
    Reports : undefined
}

const Stack = createNativeStackNavigator<AppStackParamList>();

const ReportsNavigator: React.FC = () => {
    return (
        <Stack.Navigator initialRouteName="Reports" screenOptions={{headerShown: false}}>
            <Stack.Screen name="Reports" component={Reports} />
        </Stack.Navigator>
    );
};

export default ReportsNavigator;