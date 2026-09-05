import { theme } from '@/utils/theme';
import React, { FC } from 'react';
import {View, Text} from 'react-native';

interface Props {

}


const Home : FC<Props> = (props) => {
    return (
        <View className={`flex-1`} style={{backgroundColor: theme.colors.backgroundSecondary}}>
            <Text>Home</Text>
        </View>
    );
}

export default Home;