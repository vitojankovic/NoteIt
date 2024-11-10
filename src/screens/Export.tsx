import React, { useState } from 'react';
import { View, Button, Text, Modal, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import { useRecordingContext, RecordingMetadata } from './RecordingContext';

export default function ExportImport() {
  const { recordings, addRecording } = useRecordingContext();
  const [isPicking, setIsPicking] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<RecordingMetadata | null>(null);

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
    <View className="flex-1 justify-center items-center bg-background p-5">
      <Text className="text-primary text-2xl font-bold mb-4">Manage Your Recordings</Text>
      <Text className="text-secondary text-sm text-center mb-6">
        Here you can export recordings to share or save, and import previously saved recordings.
      </Text>
      <Button
        title="Export Recording"
        onPress={handleOpenExportModal}
        color="#8BB552"
      />
      <View className="my-3" />
      <Button title="Import Recording" onPress={handleImportRecording} color="#A8D867" />

      <Modal
        visible={isPicking}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPicking(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 bg-white rounded-lg p-6">
            <Text className="text-lg font-bold text-primary mb-4">Select a Recording to Export:</Text>
            <Picker
              selectedValue={selectedRecording}
              onValueChange={(itemValue) => setSelectedRecording(itemValue)}
              className="border border-gray-200 p-2 rounded mb-4"
            >
              <Picker.Item label="Select a recording" value={null} />
              {recordings.map((recording) => (
                <Picker.Item
                  key={recording.id}
                  label={recording.name || `Recording ${recording.id}`}
                  value={recording}
                />
              ))}
            </Picker>
            <View className="flex-row justify-between">
              <Button title="Cancel" onPress={() => setIsPicking(false)} color="red" />
              <Button title="Share" onPress={handleShareRecording} disabled={!selectedRecording} color="#8BB552" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
