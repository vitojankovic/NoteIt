import React, { useState, useEffect } from 'react';
import { View, Button, TextInput, StyleSheet, FlatList, Text } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface Note {
    timestamp: string;
    note: string;
}

interface RecordingMetadata {
    notes: Note[];
    audioPath: string;
}

const Record: React.FC = () => {
    const [note, setNote] = useState<string>('');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentRecordingMetadata, setCurrentRecordingMetadata] = useState<RecordingMetadata | null>(null);
    const [currentNotes, setCurrentNotes] = useState<Note[]>([]);

    useEffect(() => {
        loadRecordings();
    }, []);

    useEffect(() => {
        return sound
            ? () => {
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const loadRecordings = async () => {
        try {
            const documentDirectory = FileSystem.documentDirectory;
            if (!documentDirectory) {
                console.error('Document directory is not available');
                return;
            }

            const dirs = await FileSystem.readDirectoryAsync(documentDirectory);
            const loadedRecordings: (RecordingMetadata | null)[] = await Promise.all(
                dirs.map(async (dir) => {
                    const metadataPath = `${documentDirectory}${dir}/metadata.json`;
                    const exists = await FileSystem.getInfoAsync(metadataPath);
                    if (exists.exists) {
                        try {
                            const metadata = await FileSystem.readAsStringAsync(metadataPath);
                            return JSON.parse(metadata) as RecordingMetadata;
                        } catch (error) {
                            console.error(`Failed to read metadata from ${metadataPath}:`, error);
                        }
                    }
                    return null;
                })
            );
            setRecordings(loadedRecordings.filter(Boolean) as RecordingMetadata[]);
        } catch (error) {
            console.error('Failed to load recordings:', error);
        }
    };

    const saveRecording = async (uri: string) => {
        const timestamp = new Date().toISOString();
        const dirName = `recording_${timestamp.replace(/[:.]/g, '-')}`;
        const dirPath = `${FileSystem.documentDirectory}${dirName}`;

        try {
            console.log('Creating directory at:', dirPath);
            await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });

            const audioPath = `${dirPath}/audio.mp3`;
            console.log('Moving audio file from:', uri);
            console.log('Moving audio file to:', audioPath);
            
            await FileSystem.moveAsync({
                from: uri,
                to: audioPath,
            });

            const metadata: RecordingMetadata = {
                notes: currentRecordingMetadata?.notes || [],
                audioPath: audioPath,
            };

            const metadataPath = `${dirPath}/metadata.json`;
            console.log('Saving metadata to:', metadataPath);
            console.log('Metadata content:', JSON.stringify(metadata, null, 2));
            
            await FileSystem.writeAsStringAsync(
                metadataPath, 
                JSON.stringify(metadata, null, 2)
            );

            setRecordings(prev => [...prev, metadata]);
            console.log('Recording saved successfully with notes');
            
            setCurrentRecordingMetadata(null);
            setCurrentNotes([]);
        } catch (error) {
            console.error('Error saving recording:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
        }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access microphone is required!');
                return;
            }

            if (recording) {
                console.warn('Recording is already in progress or paused.');
                return;
            }

            const recordingInstance = new Audio.Recording();
            await recordingInstance.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
            await recordingInstance.startAsync();
            setRecording(recordingInstance);
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
                await saveRecording(uri);
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    const addNote = async () => {
        if (!note.trim() || !isRecording) return;
    
        const timestamp = new Date().toISOString();
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
            console.log('Note added successfully');
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };
    
    const playRecording = async (audioPath: string) => {
        try {
            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioPath },
                { shouldPlay: true }
            );
            setSound(newSound);
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status && 'didJustFinish' in status && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });

            await newSound.playAsync();
        } catch (error) {
            console.error('Error playing recording:', error);
        }
    };

    const stopPlayback = async () => {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
        }
    };

    return (
        <View style={styles.container}>
            <Button title="Start Recording" onPress={startRecording} disabled={isRecording} />
            <Button
                title={isPaused ? "Resume Recording" : "Pause Recording"}
                onPress={toggleRecording}
                disabled={!isRecording}
            />
            <Button title="Stop Recording" onPress={stopRecording} disabled={!isRecording} />
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="Add note..."
                    value={note}
                    onChangeText={setNote}
                    style={styles.input}
                />
                <Button title="Add Note" onPress={addNote} disabled={!isRecording} />
            </View>

            {isRecording && currentNotes.length > 0 && (
                <View style={styles.currentRecordingNotes}>
                    <Text style={styles.notesHeader}>Current Recording Notes:</Text>
                    {currentNotes.map((note, index) => (
                        <View key={index} style={styles.noteItem}>
                            <Text style={styles.noteTimestamp}>
                                {new Date(note.timestamp).toLocaleString()}
                            </Text>
                            <Text style={styles.noteText}>{note.note}</Text>
                        </View>
                    ))}
                </View>
            )}

            <FlatList
                data={recordings}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.recordingItem}>
                        <Text style={styles.recordingPath}>Recording: {item.audioPath}</Text>
                        <View style={styles.playbackControls}>
                            <Button
                                title={isPlaying ? "Stop" : "Play"}
                                onPress={() => isPlaying ? stopPlayback() : playRecording(item.audioPath)}
                            />
                        </View>
                        <Text style={styles.notesHeader}>Notes:</Text>
                        {item.notes && item.notes.length > 0 ? (
                            item.notes.map((note, index) => (
                                <View key={index} style={styles.noteItem}>
                                    <Text style={styles.noteTimestamp}>
                                        {new Date(note.timestamp).toLocaleString()}
                                    </Text>
                                    <Text style={styles.noteText}>{note.note}</Text>
                                </View>
                            ))
                        ) : (
                            <Text>No notes for this recording</Text>
                        )}
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        padding: 8,
        marginRight: 8,
    },
    recordingItem: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
    },
    recordingPath: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    notesHeader: {
        fontWeight: 'bold',
        marginVertical: 4,
    },
    noteItem: {
        marginLeft: 8,
        marginVertical: 4,
    },
    noteTimestamp: {
        fontSize: 12,
        color: '#666',
    },
    noteText: {
        marginTop: 2,
    },
    playbackControls: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginVertical: 8,
    },
    currentRecordingNotes: {
        marginBottom: 16,
    },
});

export default Record;