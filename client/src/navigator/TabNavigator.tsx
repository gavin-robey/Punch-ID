import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AppNavigator from './app/AppNavigator';
import ProfileNavigator from './app/ProfileNavigator';
import PunchNavigator from './app/PunchNavigator';
import ReportsNavigator from './app/ReportsNavigator';
import ScanNavigator from './app/ScanNavigator';
import { theme } from '@/utils/theme';
import { AntDesign } from '@react-native-vector-icons/ant-design';


const Tab = createBottomTabNavigator();

const TabNavigator: React.FC = () => {
    return (
        <>
            <Tab.Navigator screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarStyle: { 
                    backgroundColor: theme.colors.backgroundPrimary,
                    overflow: 'visible',
                    height: 80,
                },
                tabBarLabelStyle: {
                    marginTop: 6,
                },
            }}>
                <Tab.Screen name="HomeNavigator" component={AppNavigator} options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, focused, size }) => { return <AntDesign name="home" size={size} color={color} /> }
                }} />
                <Tab.Screen name="PunchNavigator" component={PunchNavigator} options={{
                    tabBarLabel: 'Items',
                    tabBarIcon: ({ color, focused, size }) => { return <AntDesign name="unordered-list" size={size} color={color} /> }
                }} />
                <Tab.Screen name="ScanNavigator" component={ScanNavigator} options={{
                    tabBarLabel: 'Scan',
                    tabBarIcon: ({ color, focused, size }) => {
                        return (
                            <View className={focused ? '-mt-8 h-16 w-16 items-center justify-center rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]' : '-mt-8 h-16 w-16 items-center justify-center rounded-full '} style={{backgroundColor: theme.colors.primary}}>
                                <AntDesign name="qrcode" size={focused ? (size * 1.1) : size} color={focused ? theme.colors.textPrimary : theme.colors.textSecondary} />
                            </View>
                        )
                    }
                }} />
                <Tab.Screen name="ReportsNavigator" component={ReportsNavigator} options={{
                    tabBarLabel: 'Reports',
                    tabBarIcon: ({ color, size }) => { return ( <AntDesign name="bar-chart" size={size} color={color} />) }
                }} />
                <Tab.Screen name="ProfileNavigator" component={ProfileNavigator} options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => { return ( <AntDesign name="user" size={size} color={color} />) }
                }} />
            </Tab.Navigator>
        </>
    );
};

export default TabNavigator;