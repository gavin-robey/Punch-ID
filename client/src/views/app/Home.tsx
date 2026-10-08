import { AppStackParamList } from '@/navigator/app/AppNavigator';
import { theme } from '@/utils/theme';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { FC } from 'react';
import {View, Text, Button} from 'react-native';



const Home : FC = () => {
    const { navigate } = useNavigation<NavigationProp<AppStackParamList>>();


    return (
        <View className={`flex-1`} style={{backgroundColor: theme.colors.backgroundSecondary}}>
            <View className='text-white'>
                <Text className='text-white'>Home</Text>
                <Text className='text-white'>Quick Actions</Text>
                <Button
                    title='add punch item'
                    onPress={() => navigate('AddPunchItem')}
                />
            </View>
        </View>
    );
}

export default Home;