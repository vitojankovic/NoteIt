import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Home = () => {
    const navigation = useNavigation();

    return (
        <View className="flex-1 justify-center items-center">
            <Text className="text-xl mb-4">Welcome to the Audio Recorder App!</Text>

        </View>
    );
};

export default Home; 