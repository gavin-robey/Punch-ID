import React, { FC } from 'react';
import {View, Text} from 'react-native';

interface Props {

}


const Home : FC<Props> = (props) => {
    return (
        <View className='flex-1'>
            <Text>Home</Text>
        </View>
    );
}

export default Home;