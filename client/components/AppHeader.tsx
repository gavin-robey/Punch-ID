import React, { FC } from 'react';
import {View, Text} from 'react-native';



const AppHeader : FC = () => {
    return (
        <View className='flex-row items-baseline'>
            <Text className={`text-[28px] font-bold text-white`}>
                PUNCH
            </Text>
            <Text className={`ml-1 text-lg font-normal text-red-500`}>
                ID
            </Text>
        </View>
    );
}

export default AppHeader;