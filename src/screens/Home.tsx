import React from 'react';
import { View, Text } from 'react-native';

const Home = () => {
    return (
        <View className="flex-1 justify-center items-center bg-background">
            <Text className="text-xl mb-4 font-sans text-primary">Welcome to the Audio Recorder App!</Text>
        </View>
    );
};

export default Home;