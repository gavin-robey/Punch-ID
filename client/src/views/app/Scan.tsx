import { FC } from 'react';
import {View, Text} from 'react-native';

interface Props {
}


const Scan : FC<Props> = (props) => {
    return (
        <View className='flex-1'>
            <Text>Scan</Text>
        </View>
    );
}

export default Scan;