import React, { FC } from 'react';
import {View, Text} from 'react-native';
import Home from './Reports';

interface Props {

}


const PunchItems : FC<Props> = (props) => {
    return (
        <View className='flex-1'>
            <Text>Punch Items</Text>
        </View>
    );
}

export default PunchItems;