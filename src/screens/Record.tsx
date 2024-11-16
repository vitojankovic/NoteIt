import React, { useState, useEffect } from 'react';
import { View, Button, TextInput, FlatList, Text, Modal, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons'
import Animated, { withTiming, useSharedValue, useAnimatedStyle, withRepeat, Easing } from 'react-native-reanimated';

interface Note {
    timestamp: number;
    note: string;
}

interface RecordingMetadata {
    name: string,
    notes: Note[];
    audioPath: string;
}

const Record: React.FC = () => {
    const [note, setNote] = useState<string>('');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
    const [currentRecordingMetadata, setCurrentRecordingMetadata] = useState<RecordingMetadata | null>(null);
    const [currentNotes, setCurrentNotes] = useState<Note[]>([]);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [recordingName, setRecordingName] = useState<string>('');
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [duration, setDuration] = useState<string>('0:00:00')
    const [noteCount, setNoteCount] = useState<number>(0)
    const [isAddNoteVisible, setIsAddNoteVisible] = useState(false)
    const [isSaveModalVisible, setIsSaveModalVisible] = useState(false)


    const pulse = useSharedValue(1);
    const pulseStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            scale: withRepeat(
              withTiming(1.2, { duration: 1000, easing: Easing.ease }), // Expanding
              -1, // Repeat infinitely
              true // Alternate between expanding and contracting
            ),
          },
        ],
      };
    });


    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isRecording) {
          interval = setInterval(async () => {
            if (recording) {
              const status = await recording.getStatusAsync()
              const milliseconds = status.durationMillis || 0
              const seconds = Math.floor((milliseconds / 1000) % 60)
              const minutes = Math.floor((milliseconds / (1000 * 60)) % 60)
              const hours = Math.floor(milliseconds / (1000 * 60 * 60))
              setDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
            }
          }, 1000)
        }
        return () => clearInterval(interval)
      }, [isRecording, recording])
    


    const saveRecording = async (uri: string, name: string) => {
        const timestamp = new Date().toISOString();
        const dirName = `recording_${timestamp.replace(/[:.]/g, '-')}`;
        const dirPath = `${FileSystem.documentDirectory}${dirName}`;

        try {
            await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });

            const audioPath = `${dirPath}/audio.mp3`;
            await FileSystem.moveAsync({
                from: uri,
                to: audioPath,
            });

            const metadata: RecordingMetadata = {
                name,
                notes: currentRecordingMetadata?.notes || [],
                audioPath: audioPath,
            };

            const metadataPath = `${dirPath}/metadata.json`;
            await FileSystem.writeAsStringAsync(
                metadataPath,
                JSON.stringify(metadata, null, 2)
            );

            setRecordings(prev => [...prev, metadata]);
            setCurrentRecordingMetadata(null);
            setCurrentNotes([]);
        } catch (error) {
            console.error('Error saving recording:', error);
        }
    };

    const startRecording = async () => {
        try {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
            console.error('Permission to access microphone is required!');
            return;
          }
    
          // Check if there's an existing recording and unload it
          if (recording) {
            console.log('Unloading existing recording before starting a new one');
            await recording.unloadAsync();
            setRecording(null);
          }
    
          console.log('Starting new recording');
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
    
          const { recording: newRecording } = await Audio.Recording.createAsync(
            Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
          );
    
          setRecording(newRecording);
          setIsRecording(true);
          setIsPaused(false);
          
          setCurrentRecordingMetadata(null);
          setCurrentNotes([]);
        } catch (error) {
          console.error('Error starting recording:', error);
        }
      };
      
    const toggleRecording = async () => {
        if (!recording) return;

        try {
            if (isPaused) {
                await recording.startAsync();
                setIsPaused(false);
            } else {
                await recording.pauseAsync();
                setIsPaused(true);
            }
        } catch (error) {
            console.error(isPaused ? 'Error resuming recording:' : 'Error pausing recording:', error);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setIsRecording(false);
            setRecording(null);
            setIsPaused(false);
            if (uri) {
                setRecordingUri(uri);
                setIsSaveModalVisible(true);
                setRecordingName('');
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    const handleSaveRecording = async () => {
        if (!recordingName.trim()) {
            console.error('Recording name cannot be empty');
            return;
        }

        if (recordingUri) {
            await saveRecording(recordingUri, recordingName.trim());
            setIsModalVisible(false);
            setRecordingUri(null);
        } else {
            console.error('No recording URI available');
        }
    };

    const addNote = async () => {
        
        if (!note.trim() || !isRecording || !recording ) return;
        const status = await recording.getStatusAsync()

        let timestamp: number = 0;

        if(status && status.isRecording){
            timestamp = status.durationMillis ?? 0;
        }
    
        const newNote: Note = {
            timestamp,
            note: note.trim(),
        };
    
        try {
            const uri = recording?.getURI();
            if (!uri) {
                console.error('No active recording URI found');
                return;
            }
    
            // Check if we need to create a new metadata object or update existing
            if (!currentRecordingMetadata) {
                // Initialize currentRecordingMetadata if it doesn't exist
                const newRecordingMetadata: RecordingMetadata = {
                    notes: [newNote],
                    audioPath: uri,
                };
                setCurrentRecordingMetadata(newRecordingMetadata);
                setCurrentNotes([newNote]); // Initialize currentNotes
            } else {
                // Update the existing currentRecordingMetadata with the new note
                const updatedMetadata: RecordingMetadata = {
                    ...currentRecordingMetadata,
                    notes: [...currentRecordingMetadata.notes, newNote],
                };
                setCurrentRecordingMetadata(updatedMetadata);
                setCurrentNotes(prevNotes => [...prevNotes, newNote]); // Update currentNotes
            }
    
            // Clear the note input field
            setNote('');
            setNoteCount(noteCount+1)
            console.log('Note added successfully');
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };
    

    return (
        <View className="flex-1 bg-[#111111] items-center justify-center">
        {isRecording ? (
          <View className="items-center">
            <Text className="text-txtp text-7xl mb-12">{duration}</Text>
            <Animated.View>
              <Ionicons name="mic" size={200} color="#ffffff" style={pulseStyle} />
            </Animated.View>
            <Text className="text-txts text-4xl mt-12">{noteCount} notes added</Text>
            <View className="flex-row mt-16 space-x-8">
              <TouchableOpacity
                className="w-24 h-24 rounded-full bg-paper border-2 border items-center justify-center"
                onPress={() => toggleRecording()}>
                {isPaused ? <Ionicons name="caret-forward" size={54} color="#ffffff" /> : <Ionicons name="pause" size={54} color="#ffffff" />}
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-24 h-24 bg-white rounded-full items-center justify-center mx-[10%]"
                onPress={() => setIsAddNoteVisible(true)}>
                <Ionicons name="pin" size={54} color="#fffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-24 h-24 rounded-full border-2 bg-paper items-center justify-center"
                onPress={stopRecording}>
                <Ionicons name="stop" size={54} color="#f44336" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={startRecording} className="items-center">
            <Text className="text-txtp text-6xl mb-12">Start Recording</Text>
            <Ionicons name="mic" size={240} color="#ffffff" />
          </TouchableOpacity>
        )}
  
        <Modal
          animationType="slide"
          transparent={true}
          visible={isAddNoteVisible}
          onRequestClose={() => setIsAddNoteVisible(false)}>
          <View className="flex-1 justify-center items-center bg-paper/50">
            <View className="bg-background p-6 rounded-2xl w-[90%] border border-background">
              <Text className="text-txtp text-4xl mb-4">Add Note</Text>
              <TextInput
                className="bg-paper text-txts p-4 text-2xl rounded-lg mb-4 h-[100px]"
                placeholder="Enter your note..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={note}
                onChangeText={setNote}
                multiline
              />
              <View className="flex-row justify-between space-x-4">
                <TouchableOpacity onPress={() => setIsAddNoteVisible(false)}>
                  <Text className="text-warning text-2xl pt-[10px]">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addNote}>
                  <Text className="text-primary font-bold text-2xl pt-[10px]">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
  
        <Modal
          animationType="slide"
          transparent={true}
          visible={isSaveModalVisible}
          onRequestClose={() => setIsSaveModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-background p-6 rounded-2xl w-[80%] border border-paper">
              <Text className="text-txtp text-3xl mb-4">Save Recording</Text>
              <TextInput
                className="bg-white/10 text-txts p-4 rounded-lg mb-4"
                placeholder="Enter recording name..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={recordingName}
                onChangeText={setRecordingName}
              />
              <View className="flex-row justify-between space-x-4">
                <TouchableOpacity onPress={() => setIsSaveModalVisible(false)}>
                  <Text className="text-warning text-2xl pt-2">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  // Handle save logic here
                  setIsSaveModalVisible(false)
                  setRecordingName('')
                  handleSaveRecording()
                }}>
                  <Text className="text-primary font-bold text-2xl pt-2">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
};

export default Record;