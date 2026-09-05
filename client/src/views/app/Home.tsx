import { theme } from '@/utils/theme';
import { FC } from 'react';
import {View, Text} from 'react-native';



const Home : FC = () => {
    return (
        <View className={`flex-1`} style={{backgroundColor: theme.colors.backgroundSecondary}}>
            <Text>Home</Text>
        </View>
    );
}

export default Home;