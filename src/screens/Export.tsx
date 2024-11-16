import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Alert, TouchableOpacity, Pressable } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import { useRecordingContext, RecordingMetadata } from './RecordingContext';
import LottieView from 'lottie-react-native';
import Animated, { withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

export default function ExportImport() {
  const { recordings, addRecording } = useRecordingContext();
  const [isPicking, setIsPicking] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<RecordingMetadata | null>(null);

  // Shared values for animations
  const fadeAnimTitle = useSharedValue(0);
  const fadeAnimButtons = useSharedValue(0);
  const fadeAnimLottie = useSharedValue(0);
  const fadeAnimModal = useSharedValue(0);

  // Trigger staggered animations on component mount
  useEffect(() => {
    fadeAnimTitle.value = withTiming(1, { duration: 1500 });
    fadeAnimLottie.value = withTiming(1, { duration: 1000 });
    fadeAnimButtons.value = withTiming(1, { duration: 2000 });
    fadeAnimModal.value = withTiming(1, { duration: 3000 });
  }, []);

  // Animated styles for staggered fade-in effect
  const fadeStyleTitle = useAnimatedStyle(() => ({
    opacity: fadeAnimTitle.value,
  }));

  const fadeStyleButtons = useAnimatedStyle(() => ({
    opacity: fadeAnimButtons.value,
  }));

  const fadeStyleLottie = useAnimatedStyle(() => ({
    opacity: fadeAnimLottie.value,
  }));

  const fadeStyleModal = useAnimatedStyle(() => ({
    opacity: fadeAnimModal.value,
  }));

  const handleOpenExportModal = () => setIsPicking(true);

  const handleShareRecording = async () => {
    if (selectedRecording) {
      await exportRecording(selectedRecording);
    } else {
      Alert.alert('Error', 'Please select a recording to export.');
    }
    setIsPicking(false);
  };

  const exportRecording = async (recording: RecordingMetadata) => {
    try {
      const fileName = `exported_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const audioBase64 = await FileSystem.readAsStringAsync(recording.audioPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const exportData = { ...recording, audioBase64 };
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.log("Export error:", error);
      Alert.alert('Error', 'An error occurred while exporting the recording.');
    }
  };

  const handleImportRecording = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileContents = await FileSystem.readAsStringAsync(fileUri);
        const importedData = JSON.parse(fileContents);
        const newRecording: RecordingMetadata = {
          name: importedData.name,
          notes: importedData.notes,
          audioPath: importedData.audioBase64,
        };
        await addRecording(newRecording);
        Alert.alert('Success', 'Recording imported successfully!');
      }
    } catch (error) {
      console.log("Import error:", error);
      Alert.alert('Error', 'An error occurred while importing the recording.');
    }
  };

  return (
    <View className="flex-1 bg-background p-8">
      {/* Title Text */}
      <Animated.Text
        style={[fadeStyleTitle, { fontSize: 48, fontWeight: 'bold', color: '#ffffff' }]}
        className="mb-2 font-sans pt-[10vh] mb-[5vh]"
      >
        Fancy Sharing Your Sounds?
      </Animated.Text>

      {/* Lottie Animation */}
      <Animated.View style={[fadeStyleLottie, { alignItems: 'center' }]}>
        <LottieView
          autoPlay
          loop
          style={{
            width: '80%',
            height: 250,
            maxWidth: 400,
          }}
          source={require('./lottie-data-transfer.json')}
        />
      </Animated.View>

      {/* Export Button */}
      <Animated.View style={[fadeStyleButtons, { marginBottom: 20 }]}>
        <TouchableOpacity onPress={handleOpenExportModal} className="bg-paper p-8 rounded-[16px] shadow-md">
          <Text className="text-txtp text-center text-3xl">Export Recording</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Import Button */}
      <Animated.View style={[fadeStyleButtons]}>
        <TouchableOpacity onPress={handleImportRecording} className="bg-paper p-8 rounded-[16px] shadow-md">
          <Text className="text-txtp text-center text-3xl">Import Recording</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal for Export Selection */}
      <Modal visible={isPicking} animationType="slide" transparent={true} onRequestClose={() => setIsPicking(false)}>
        <Animated.View style={[fadeStyleModal, { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View className="w-4/5 bg-paper rounded-[16px] p-6 shadow-lg">
            <Text className="text-lg font-bold text-txtp mb-4">Select a Recording to Export:</Text>
            <View className="border border-txts rounded-[16px] mb-4 overflow-hidden">
              <Picker
                selectedValue={selectedRecording}
                onValueChange={(itemValue) => setSelectedRecording(itemValue)}
              >
                <Picker.Item label="Select a recording" value={null} />
                {recordings.map((recording) => (
                  <Picker.Item
                    key={recording.id}
                    label={recording.name || `Recording ${recording.id}`}
                    value={recording}
                    color="#ffffff"
                  />
                ))}
              </Picker>
            </View>
            <View className="flex-row justify-between">
              <Pressable onPress={() => setIsPicking(false)} className="bg-secondary px-4 py-2 rounded-[16px]">
                <Text className="text-txtp">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleShareRecording}
                disabled={!selectedRecording}
                className={`px-4 py-2 rounded-[16px] ${selectedRecording ? 'bg-primary' : 'bg-primary/50'}`}
              >
                <Text className="text-txtp">Share</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}
