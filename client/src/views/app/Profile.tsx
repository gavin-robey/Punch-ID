import { FC } from 'react';
import {View, Text} from 'react-native';

interface Props {

}


const Profile : FC<Props> = (props) => {
    return (
        <View className='flex-1'>
            <Text>Profile</Text>
        </View>
    );
}

export default Profile;