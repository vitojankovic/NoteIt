import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRecordingContext } from './RecordingContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomePage() {
  const { recordings, loadRecordings } = useRecordingContext();

  React.useEffect(() => {
    loadRecordings();
  }, []);

  const renderWaveform = (notes: { timestamp: number; importance: string }[]) => {
    const maxTimestamp = Math.max(...notes.map(note => note.timestamp));

    return (
      <View className="flex-row items-center justify-start w-full h-16">
        <View className="absolute top-14 left-0 right-0 h-1 bg-primary" />
        {notes.map((note, index) => {
          const position = (note.timestamp / maxTimestamp) * 100;
          const bumpHeight = note.importance === 'high' ? 10 : 5;

          return (
            <View
              key={index}
              className="absolute bottom-0 w-1 bg-primary"
              style={{
                left: `${position}%`,
                height: bumpHeight,
              }}
            />
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 py-6 pt-[100px]">
      <View className="mb-8">
        <Text className="text-4xl font-bold text-primary mb-2">Welcome back</Text>
        <Text className="text-lg text-secondary">Ready to capture your thoughts?</Text>
      </View>

      <View className="mb-8">
        <Text className="text-2xl font-semibold text-primary mb-4">Your Studio</Text>
        <View className="bg-accent rounded-lg p-4">
          <Text className="text-3xl font-bold text-background">{recordings.length}</Text>
          <Text className="text-background">Total Recordings</Text>
        </View>
      </View>

      <View className="mb-8">
        <Text className="text-2xl font-semibold text-primary mb-4">Recent Recordings</Text>
        <View className="grid grid-cols-2 gap-4">
          {recordings.slice(0, 4).map((recording, index) => (
            <TouchableOpacity
              key={index}
              className="bg-secondary rounded-lg p-4"
              onPress={() => {/* Navigate to recording details */}}
            >
              <Text className="text-lg font-semibold text-background mb-2" numberOfLines={1}>
                {recording.name}
              </Text>
              {renderWaveform(recording.notes)}
              <View className="flex-row items-center mt-2">
                <Ionicons name="play" size={16} color="#111111" />
                <Text className="text-background text-sm ml-1">Play</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        className="bg-primary rounded-full py-4 px-6 items-center"
        onPress={() => {/* Navigate to Record.tsx */}}
      >
        <View className="flex-row items-center">
          <Ionicons name="mic" size={24} color="#111111" />
          <Text className="text-background text-lg font-semibold ml-2">Start New Recording</Text>
        </View>
      </TouchableOpacity>

      <View className="mt-8">
        <Text className="text-sm text-secondary text-center">
          © 2023 Your Recording App. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}