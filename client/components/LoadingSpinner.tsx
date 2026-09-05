import React, { FC } from 'react';
import {Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';

const LoadingSpinner : FC = () => {
    return (
        <Modal animationType="fade" transparent={true}>
            <BlurView className='flex-1' intensity={20} tint="light">
                <LottieView 
                    source={require('../src/assets/loading.json')} 
                    autoPlay 
                    loop 
                    speed={2}
                    style={{flex: 1,  transform: [{ scale: 0.3 }]}}
                />
            </BlurView>
        </Modal>
    );
}

export default LoadingSpinner;