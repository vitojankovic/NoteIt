import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, Pressable } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import DropDownPicker from 'react-native-dropdown-picker';  // Importing the dropdown picker
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

  // Trigger staggered animations on component mount
  useEffect(() => {
    fadeAnimTitle.value = withTiming(1, { duration: 1500 });
    fadeAnimLottie.value = withTiming(1, { duration: 1000 });
    fadeAnimButtons.value = withTiming(1, { duration: 2000 });
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

      {/* Full-Screen Overlay for Export Selection */}
      {isPicking && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '90%',
              maxWidth: 400,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333',
                marginBottom: 16,
              }}
            >
              Select a Recording to Export:
            </Text>

            {/* Dropdown Picker */}
            <DropDownPicker
              items={[
                { label: "Select a recording", value: null },
                ...recordings.map((recording) => ({
                  label: recording.name || `Recording ${recording.id}`,
                  value: recording,
                })),
              ]}
              defaultValue={selectedRecording}
              onChangeItem={(item) => setSelectedRecording(item.value)}
              containerStyle={{
                height: 50,
                borderRadius: 12,
                marginBottom: 16,
                borderWidth: 1,
              }}
              style={{ backgroundColor: '#fff' }}
              dropDownStyle={{
                backgroundColor: '#fff',
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Pressable
                onPress={() => setIsPicking(false)}
                style={{
                  backgroundColor: '#f44336',
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#ffff', fontSize: 16 }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleShareRecording}
                disabled={!selectedRecording}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  backgroundColor: selectedRecording ? '#4a90e2' : '#a0c4e9',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>Share</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
