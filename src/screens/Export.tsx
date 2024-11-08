import React, { useState } from 'react';
import { View, Button, Text, Modal, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import { useRecordingContext, RecordingMetadata } from './RecordingContext';

export default function ExportImport() {
  const { recordings, addRecording } = useRecordingContext();
  const [isPicking, setIsPicking] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<RecordingMetadata | null>(null);

  const handleOpenExportModal = () => {
    setIsPicking(true);
  };

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

      // Read audio file as base64 for embedding in JSON
      const audioBase64 = await FileSystem.readAsStringAsync(recording.audioPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Construct export data
      const exportData = {
        ...recording,
        audioBase64,
      };

      // Save to a JSON file in cache
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      // Share the JSON file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }

      // Provide a download option
      await downloadExportedFile(fileUri);

      // Clean up temporary file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });

    } catch (error) {
      console.log("Export error:", error);
      Alert.alert('Error', 'An error occurred while exporting the recording.');
    }
  };

  const downloadExportedFile = async (fileUri: string) => {
    try {
      // You can implement the logic for downloading the file to a local path on the device if needed.
      const downloadPath = `${FileSystem.documentDirectory}${fileUri.split('/').pop()}`;
      
      await FileSystem.copyAsync({ from: fileUri, to: downloadPath });

      Alert.alert('Download Success', `File downloaded successfully to ${downloadPath}`);
    } catch (error) {
      console.log('Download Error:', error);
      Alert.alert('Download Error', 'An error occurred while downloading the file.');
    }
  };

  const handleImportRecording = async () => {
    try {
        // Pick the JSON file containing the recording metadata
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });

        // Ensure the URI exists
        if (result.uri) {
            const fileUri = result.uri;
            console.log('Picked file URI:', fileUri);

            // Ensure the file exists before reading
            const fileExists = await FileSystem.getInfoAsync(fileUri);
            if (!fileExists.exists) {
                Alert.alert('Error', 'The selected file does not exist.');
                return;
            }

            // Read the contents of the file
            const fileContents = await FileSystem.readAsStringAsync(fileUri);
            const importedData = JSON.parse(fileContents);

            // Decode audio and save to file system
            const audioPath = `${FileSystem.documentDirectory}${importedData.name}_${Date.now()}.mp3`;
            await FileSystem.writeAsStringAsync(audioPath, importedData.audioBase64, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Prepare the new recording data
            const newRecording = {
                ...importedData,
                audioPath,  // Save the decoded audio file's path
                audioBase64: undefined,  // Remove base64 from the final object
            };

            // Add the new recording to context and save it
            await addRecording(newRecording);  // Use the addRecording function here
            
            Alert.alert('Success', 'Recording imported successfully!');
        } else {
            Alert.alert('Error', 'No file selected or import was canceled.');
        }
    } catch (error) {
        console.log("Import error:", error);
        Alert.alert('Error', 'An error occurred while importing the recording.');
    }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Export/Import Recordings</Text>
      <Button title="Select and Export Recording" onPress={handleOpenExportModal} />
      <Button title="Import Recording" onPress={handleImportRecording} />
      <Modal
        visible={isPicking}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPicking(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Recording to Export:</Text>
            <Picker
              selectedValue={selectedRecording}
              onValueChange={(itemValue) => setSelectedRecording(itemValue)}
              style={styles.picker}
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
            <View style={styles.buttonContainer}>
              <Button title="Share" onPress={handleShareRecording} disabled={!selectedRecording} />
              <Button title="Cancel" onPress={() => setIsPicking(false)} color="red" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
