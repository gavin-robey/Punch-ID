import React, { FC } from 'react';
import {View, Text} from 'react-native';

interface Props {
    title: string,
    subtitle: string
    isDarkMode: boolean
}


const Header : FC<Props> = (props) => {
    return (
        <View className='absolute left-5 right-0 top-5'>
            <Text className={`mb-2.5 text-[28px] font-bold ${props.isDarkMode ? "text-white" : "text-black"} `}>
                {props.title}
            </Text>
            <Text className={`mb-37.5 text-lg font-normal ${props.isDarkMode ? "text-gray-300" : "text-gray-600"} `}>
                {props.subtitle}
            </Text>
        </View>
    );
}

export default Header;
