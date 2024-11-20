import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRecordingContext } from './RecordingContext';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import Animated, { withSpring, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons'

const HomePage = () => {
  const { recordings, loadRecordings } = useRecordingContext();
  const navigation = useNavigation();

  // Shared values for animations
  const fadeAnim = useSharedValue(0); // Fade-in effect
  const fadeAnim2 = useSharedValue(0);
  const scaleAnim = useSharedValue(0.7); // Scale-in effect

  // Trigger animations on component mount
  useEffect(() => {
    loadRecordings();

    // Animation start
    fadeAnim.value = withTiming(1, { duration: 2000 });
    fadeAnim2.value = withTiming(1, { duration: 1000 });
    scaleAnim.value = withSpring(1, { damping: 5, stiffness: 100 });
  }, []);

  // Animated styles
  const fadeStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const fadeStyle2 = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim2.value,
    };
  });


  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  // Navigate to Record screen
  const navigateToRecord = () => {
    navigation.navigate('Record');
  };

  return (
    <View className="flex-1 bg-background p-6">
      {/* Title and Description */}
      <View className="mb-10 pt-12">
        <Animated.Text
          style={[fadeStyle, scaleStyle, { fontSize: 48, fontWeight: 'bold', color: '#ffffff' }]}
          className="mb-2"
        >
          Another Recording ?
        </Animated.Text>
        <Animated.Text
          style={[fadeStyle, scaleStyle, { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }]}
        >
          Assign text to any part of an audio and listen to it over and over!
        </Animated.Text>
      </View>

      {/* Lottie Animation */}
      <Animated.View className="items-center" style={[fadeStyle2, scaleStyle]}>
        <LottieView
          autoPlay
          loop
          style={{
            width: '80%', // 80% of the screen width
            height: 250, // Fixed height
            maxWidth: 400, // Maximum width in pixels
          }}
          source={require('./lottie-waves.json')}
        />
      </Animated.View>

      {/* Total Recordings Button */}
      <Animated.View className="items-center mt-8" style={[fadeStyle, scaleStyle]}>
        <TouchableOpacity
          className="bg-paper text-txtp w-[80%] h-[75px] rounded-[16px] flex justify-center flex-row items-center text-center hover:bg-accent transition-colors duration-300 ease-in-out"
        >
          <Ionicons name="folder" size={24} color="#ffffff" style={{ marginRight: 12 }} />
          <Text className="text-txtp text-1xl font-semibold">
            Total Recordings: {recordings.length}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Start Recording Button */}
      <Animated.View className="items-center mt-8" style={[fadeStyle, scaleStyle]}>
        <TouchableOpacity
          onPress={navigateToRecord}
          className="bg-secondary text-txtp w-[80%] h-[75px] rounded-[16px] flex-row flex justify-center items-center text-center hover:bg-primary transition-colors duration-300 ease-in-out"
        >
          <Ionicons name="mic" size={24} color="#ffffff" style={{ marginRight: 12 }} />
          <Text className="text-white text-1xl font-bold">
            Start Recording
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default HomePage;
